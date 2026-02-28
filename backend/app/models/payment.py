import uuid
from typing import Optional
from datetime import datetime, timezone, date
from sqlmodel import Field, SQLModel, Relationship

class InvoiceBase(SQLModel):
    """
    Base properties for an Invoice.
    """
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    amount: float
    currency: str = Field(default="INR")
    status: str = Field(default="PENDING", description="PENDING, PAID, FAILED, PAID_OFFLINE")
    due_date: date
    razorpay_order_id: str | None = Field(default=None, index=True)
    razorpay_payment_id: str | None = Field(default=None)

class Invoice(InvoiceBase, table=True):
    """
    Database representation of a financial invoice.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    paid_at: datetime | None = Field(default=None)

class SubscriptionBase(SQLModel):
    """
    Tracks the active modules and schedule for a student.
    """
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    module_id: uuid.UUID = Field(foreign_key="module.id")
    
    # Pricing fields
    sessions_per_day: int = Field(default=1, ge=1)
    total_sessions_purchased: int = Field(default=0)
    
    start_date: date
    next_billing_date: date
    
    is_active: bool = Field(default=True)
    is_frozen: bool = Field(default=False)
    freeze_start_date: date | None = Field(default=None)
    freeze_credit_days: int = Field(default=0)

class Subscription(SubscriptionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class SubscriptionSlot(SQLModel, table=True):
    """
    Link table for specific dates/slots selected by the student.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    subscription_id: uuid.UUID = Field(foreign_key="subscription.id", index=True)
    inventory_slot_id: uuid.UUID = Field(foreign_key="inventorycapacity.id")
    booking_date: date
