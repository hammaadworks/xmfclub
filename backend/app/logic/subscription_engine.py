import uuid
from datetime import date, timedelta, datetime, timezone
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models.payment import Subscription, Invoice
from app.models.inventory import InventoryCapacity
from app.models.module import Module

SESSION_RATE = 20.0  # Base rate per session in INR

async def get_active_subscription(session: Session, user_id: uuid.UUID, module_id: uuid.UUID):
    """
    Check if user already has an active subscription for this module.
    """
    statement = select(Subscription).where(
        Subscription.user_id == user_id,
        Subscription.module_id == module_id,
        Subscription.is_active == True
    )
    result = await session.exec(statement)
    return result.first()

def calculate_subscription_price(sessions_per_day: int, days: int) -> float:
    """
    Core pricing logic: Sessions * Rate * Duration.
    """
    return float(sessions_per_day * days * SESSION_RATE)

async def calculate_pro_rata_adjustment(
    subscription: Subscription, 
    new_sessions_per_day: int,
    new_end_date: date | None = None
) -> float:
    """
    Calculate the extra amount needed for mid-month changes.
    Formula: (New Daily Rate - Old Daily Rate) * Remaining Days
    """
    today = date.today()
    remaining_days = (subscription.next_billing_date - today).days
    if remaining_days < 0:
        remaining_days = 0
        
    old_daily_rate = subscription.sessions_per_day * SESSION_RATE
    new_daily_rate = new_sessions_per_day * SESSION_RATE
    
    price_diff = (new_daily_rate - old_daily_rate) * remaining_days
    
    # If extending date
    if new_end_date and new_end_date > subscription.next_billing_date:
        extra_days = (new_end_date - subscription.next_billing_date).days
        extension_cost = new_daily_rate * extra_days
        price_diff += extension_cost
        
    return price_diff

async def apply_leave(session: Session, subscription_id: uuid.UUID, days: int = 1):
    """
    Leave logic: Shift end date forward by N days.
    """
    sub = await session.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.next_billing_date += timedelta(days=days)
    session.add(sub)
    await session.commit()
    return sub
