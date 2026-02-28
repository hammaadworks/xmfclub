import uuid
from datetime import date, timedelta, datetime, timezone
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models.payment import Subscription, Invoice
from app.models.inventory import InventoryCapacity
from app.models.module import Module

async def validate_capacity(session: Session, module_id: uuid.UUID, slot_id: uuid.UUID):
    """
    Check if slot exists, belongs to module, and is not full.
    """
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    slot = await session.get(InventoryCapacity, slot_id)
    if not slot or slot.module_id != module_id:
        raise HTTPException(status_code=400, detail="Invalid slot for this module")
        
    if slot.current_enrollment >= slot.max_capacity:
        raise HTTPException(status_code=409, detail=f"Slot for {module.name} is full.")
    
    return module, slot

from app.models.payment import Subscription, Invoice, SubscriptionSlot

async def enroll_student(
    session: Session, 
    user_id: uuid.UUID, 
    module_id: uuid.UUID, 
    slot_selections: list[dict] # list of {"slot_id": uuid, "date": date}
):
    """
    Flexible Enrollment: Create subscription and link specific dates.
    """
    # 1. Create Main Subscription
    # Calculate duration based on min/max dates in selection
    dates = [s['date'] for s in slot_selections]
    start_date = min(dates)
    end_date = max(dates)
    
    subscription = Subscription(
        user_id=user_id,
        module_id=module_id,
        sessions_per_day=1, # Default, can be adjusted
        total_sessions_purchased=len(slot_selections),
        start_date=start_date,
        next_billing_date=end_date,
        is_active=True
    )
    session.add(subscription)
    await session.flush() # Get subscription.id

    # 2. Link specific Slots/Dates
    for selection in slot_selections:
        sub_slot = SubscriptionSlot(
            subscription_id=subscription.id,
            inventory_slot_id=uuid.UUID(str(selection['slot_id'])),
            booking_date=selection['date']
        )
        session.add(sub_slot)
        
        # 3. Increment Capacity for that slot
        slot = await session.get(InventoryCapacity, uuid.UUID(str(selection['slot_id'])))
        if slot:
            slot.current_enrollment += 1
            session.add(slot)
    
    return subscription

async def finalize_payment_and_enroll(
    session: Session,
    order_id: str,
    payment_id: str,
    items: list[dict]
):
    """
    Deep interface for webhook processing.
    """
    statement = select(Invoice).where(Invoice.razorpay_order_id == order_id)
    result = await session.exec(statement)
    invoice = result.first()
    
    if not invoice or invoice.status != "PENDING":
        return None

    # Update Invoice
    invoice.status = "PAID"
    invoice.paid_at = datetime.now(timezone.utc)
    invoice.razorpay_payment_id = payment_id
    session.add(invoice)

    # Process each item
    for item in items:
        await enroll_student(
            session=session,
            user_id=invoice.user_id,
            module_id=uuid.UUID(item['module_id']),
            slot_id=uuid.UUID(item['slot_id'])
        )
    
    await session.commit()
    return invoice
