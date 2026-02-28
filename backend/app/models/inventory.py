import uuid
from typing import Optional
from datetime import datetime, timezone, time, date
from sqlmodel import Field, SQLModel, Relationship

class SlotTemplateBase(SQLModel):
    """
    The "Master Schedule". Defines recurring class times.
    """
    module_id: uuid.UUID = Field(foreign_key="module.id", index=True)
    trainer_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    
    day_of_week: int = Field(ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: time
    end_time: time
    venue: str = Field(default="Main Hall", max_length=255)
    max_capacity: int = Field(default=15, ge=1)
    is_active: bool = Field(default=True)

class SlotTemplate(SlotTemplateBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class SlotInstanceBase(SQLModel):
    """
    The "Available Supply". Actual bookable dates generated from templates.
    """
    template_id: uuid.UUID = Field(foreign_key="slottemplate.id", index=True)
    date: date
    
    # Instance-specific overrides
    trainer_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    venue: str | None = Field(default=None, max_length=255)
    max_capacity: int
    current_enrollment: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)

class SlotInstance(SlotInstanceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class InventoryRead(SQLModel):
    """
    Unified view for the calendar frontend.
    """
    id: uuid.UUID # SlotInstance ID
    template_id: uuid.UUID
    module_name: str
    trainer_name: str
    date: date
    start_time: time
    end_time: time
    max_capacity: int
    current_enrollment: int
    is_full: bool
