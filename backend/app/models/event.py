import uuid
from typing import Optional
from datetime import datetime, timezone, date, time
from sqlmodel import Field, SQLModel, Relationship

class EventBase(SQLModel):
    """
    Base properties for a Club Event (Seminar, Grading, Workshop).
    """
    title: str = Field(index=True, max_length=255)
    slug: str = Field(unique=True, index=True, max_length=255)
    description: str | None = Field(default=None)
    event_date: date
    start_time: time
    location: str = Field(default="XMFCLUB Main Dojo")
    
    # Dynamic Pricing
    public_price: float = Field(default=0.0)
    member_price: float = Field(default=0.0)
    
    is_active: bool = Field(default=True)
    max_capacity: int = Field(default=100)

class Event(EventBase, table=True):
    """
    The actual Event entry.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class EventRegistration(SQLModel, table=True):
    """
    Tracks who is attending which event.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="event.id", index=True)
    user_id: uuid.UUID | None = Field(default=None, foreign_key="user.id", index=True) # None for non-member leads
    
    # Lead capture for visitors
    full_name: str
    email: str = Field(index=True)
    phone: str = Field(index=True)
    
    is_member: bool = Field(default=False)
    paid_amount: float
    payment_status: str = Field(default="PENDING") # PENDING, PAID
    checked_in: bool = Field(default=False)
    
    qr_code_uuid: uuid.UUID = Field(default_factory=uuid.uuid4, unique=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
