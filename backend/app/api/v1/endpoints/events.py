from typing import Any
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from datetime import datetime, timezone

from app.api.deps import SessionDep, CurrentUserDep, AdminUserDep
from app.models.event import Event, EventRegistration
from app.models.user import User

router = APIRouter()

@router.get("/")
async def read_events(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Returns all upcoming active events.
    """
    statement = select(Event).where(Event.is_active == True).offset(skip).limit(limit)
    result = await session.exec(statement)
    return result.all()

@router.get("/{slug}")
async def read_event_by_slug(
    slug: str,
    session: SessionDep,
) -> Any:
    """
    Fetch event details for the standalone landing page.
    """
    statement = select(Event).where(Event.slug == slug)
    result = await session.exec(statement)
    event = result.first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/{event_id}/register")
async def register_for_event(
    event_id: uuid.UUID,
    full_name: str,
    email: str,
    phone: str,
    session: SessionDep,
) -> Any:
    """
    Register a user for an event. 
    Implements Dynamic Pricing:
    - If user exists as a member, they get the member_price.
    - Otherwise, they pay public_price and are treated as a Lead.
    """
    event = await session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Check if user is an existing member
    statement = select(User).where(User.email == email)
    result = await session.exec(statement)
    user = result.first()
    
    is_member = user is not None and user.role == 'student'
    price = event.member_price if is_member else event.public_price
    
    registration = EventRegistration(
        event_id=event_id,
        user_id=user.id if user else None,
        full_name=full_name,
        email=email,
        phone=phone,
        is_member=is_member,
        paid_amount=price,
        payment_status="PENDING" # In real app, this would redirect to Razorpay
    )
    
    session.add(registration)
    await session.commit()
    
    return {
        "registration_id": registration.id,
        "amount": price,
        "is_member": is_member,
        "qr_code_uuid": registration.qr_code_uuid
    }

@router.post("/check-in/{qr_uuid}")
async def check_in_attendee(
    qr_uuid: uuid.UUID,
    admin: AdminUserDep,
    session: SessionDep,
) -> Any:
    """
    Rapid QR check-in at the door. 
    Can only be performed by an Admin.
    """
    statement = select(EventRegistration).where(EventRegistration.qr_code_uuid == qr_uuid)
    result = await session.exec(statement)
    reg = result.first()
    
    if not reg:
        raise HTTPException(status_code=404, detail="Invalid QR Code")
        
    if reg.checked_in:
        return {"status": "already_checked_in", "name": reg.full_name}
        
    reg.checked_in = True
    session.add(reg)
    await session.commit()
    
    return {"status": "success", "name": reg.full_name}
