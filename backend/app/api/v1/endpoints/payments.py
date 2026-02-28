from typing import Any
import uuid
import razorpay
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from sqlmodel import select
from datetime import datetime, timezone, date, timedelta

from app.api.deps import SessionDep, CurrentUserDep, AdminUserDep
from app.core.config import settings
from app.models.payment import Invoice, Subscription
from app.models.module import Module
from app.models.inventory import InventoryCapacity

from app.logic.enrollment import validate_capacity, enroll_student, finalize_payment_and_enroll

router = APIRouter()

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

import json

@router.post("/create-order")
async def create_order(
    module_id: uuid.UUID,
    slot_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> Any:
    """
    Creates a Razorpay order for an A la Carte module.
    Before creating, it checks if the inventory slot is full.
    """
    # 1. Verify Module & Slot Capacity
    module, slot = await validate_capacity(session, module_id, slot_id)

    # 2. Create Razorpay Order
    amount_paise = int(module.price * 100)
    items_json = json.dumps([{"module_id": str(module_id), "slot_id": str(slot_id)}])
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"rec_{uuid.uuid4().hex[:10]}",
        "notes": {
            "user_id": str(current_user.id),
            "items": items_json
        }
    }
    
    try:
        order = client.order.create(data=order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(e)}")

    # 3. Create PENDING Invoice in DB
    invoice = Invoice(
        user_id=current_user.id,
        amount=module.price,
        due_date=date.today(),
        status="PENDING",
        razorpay_order_id=order['id']
    )
    session.add(invoice)
    await session.commit()
    
    return {
        "order_id": order['id'],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID
    }

@router.post("/create-multi-order")
async def create_multi_order(
    items: list[dict], # list of {"module_id": str, "slot_id": str}
    session: SessionDep,
    current_user: CurrentUserDep,
) -> Any:
    """
    Creates a single Razorpay order for multiple modules.
    """
    total_amount = 0
    item_details = []
    
    for item in items:
        m_id = uuid.UUID(item['module_id'])
        s_id = uuid.UUID(item['slot_id'])
        
        module, slot = await validate_capacity(session, m_id, s_id)
        total_amount += module.price
        item_details.append({"module_id": str(m_id), "slot_id": str(s_id)})

    amount_paise = int(total_amount * 100)
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"multi_{uuid.uuid4().hex[:10]}",
        "notes": {
            "user_id": str(current_user.id),
            "items": json.dumps(item_details)
        }
    }
    
    try:
        order = client.order.create(data=order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(e)}")

    invoice = Invoice(
        user_id=current_user.id,
        amount=total_amount,
        due_date=date.today(),
        status="PENDING",
        razorpay_order_id=order['id']
    )
    session.add(invoice)
    await session.commit()
    
    return {
        "order_id": order['id'],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID
    }

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    session: SessionDep,
    x_razorpay_signature: str = Header(None)
):
    """
    Handles Razorpay payment.captured webhooks.
    """
    body = await request.body()
    
    try:
        client.utility.verify_webhook_signature(
            body.decode(), 
            x_razorpay_signature, 
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = await request.json()
    event = payload.get("event")
    
    if event == "payment.captured":
        payment = payload['payload']['payment']['entity']
        order_id = payment['order_id']
        
        # 1. Fetch Order to get Notes
        order = client.order.fetch(order_id)
        notes = order.get('notes', {})
        items_str = notes.get('items')
        
        if items_str:
            items = json.loads(items_str)
        else:
            # Fallback for old single module format
            items = [{
                "module_id": notes.get('module_id'), 
                "slot_id": notes.get('slot_id')
            }]
            
        await finalize_payment_and_enroll(
            session=session,
            order_id=order_id,
            payment_id=payment['id'],
            items=items
        )
            
    return {"status": "ok"}

@router.post("/offline-payment")
async def log_offline_payment(
    user_id: uuid.UUID,
    module_id: uuid.UUID,
    slot_id: uuid.UUID,
    amount: float,
    admin: AdminUserDep,
    session: SessionDep,
) -> Any:
    """
    Allows admins to manually log cash or direct UPI payments.
    """
    # 1. Create PAID Invoice
    invoice = Invoice(
        user_id=user_id,
        amount=amount,
        due_date=date.today(),
        status="PAID_OFFLINE",
        paid_at=datetime.now(timezone.utc)
    )
    session.add(invoice)
    
    # 2. Execute Enrollment
    await enroll_student(session, user_id, module_id, slot_id)
        
    await session.commit()
    return {"message": "Offline payment logged successfully"}


@router.post("/freeze/{subscription_id}")
async def freeze_subscription(
    subscription_id: uuid.UUID,
    admin: AdminUserDep,
    session: SessionDep,
) -> Any:
    """
    Halal Freeze Logic: Pauses the subscription and credits remaining days.
    """
    sub = await session.get(Subscription, subscription_id)
    if not sub or not sub.is_active:
        raise HTTPException(status_code=404, detail="Active subscription not found")
        
    if sub.is_frozen:
        raise HTTPException(status_code=400, detail="Subscription already frozen")
        
    today = date.today()
    remaining_days = (sub.next_billing_date - today).days
    
    if remaining_days <= 0:
        raise HTTPException(status_code=400, detail="Subscription is already expired")
        
    sub.is_frozen = True
    sub.freeze_start_date = today
    sub.freeze_credit_days = remaining_days
    
    session.add(sub)
    await session.commit()
    return {"message": "Subscription frozen", "credit_days": remaining_days}

@router.post("/unfreeze/{subscription_id}")
async def unfreeze_subscription(
    subscription_id: uuid.UUID,
    admin: AdminUserDep,
    session: SessionDep,
) -> Any:
    """
    Halal Freeze Logic: Restores the subscription and extends the next billing date.
    """
    sub = await session.get(Subscription, subscription_id)
    if not sub or not sub.is_frozen:
        raise HTTPException(status_code=400, detail="Subscription is not frozen")
        
    today = date.today()
    sub.is_frozen = False
    sub.next_billing_date = today + timedelta(days=sub.freeze_credit_days)
    sub.freeze_start_date = None
    sub.freeze_credit_days = 0
    
    session.add(sub)
    await session.commit()
    return {"message": "Subscription restored", "new_billing_date": sub.next_billing_date}
