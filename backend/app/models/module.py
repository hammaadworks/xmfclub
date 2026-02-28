import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

class ModuleBase(SQLModel):
    """
    Base properties for the A la Carte Curriculum Module.
    """
    name: str = Field(index=True, max_length=255)
    category: str = Field(index=True, max_length=100, default="general")
    description: str | None = Field(default=None)
    session_price: float = Field(default=20.0, description="Rate per single training session")
    default_venue: str | None = Field(default="Main Hall", max_length=255)
    duration_weeks: int = Field(default=4)
    is_active: bool = Field(default=True)

class Module(ModuleBase, table=True):
    """
    Database representation of a training module (e.g., 'Advanced Sparring', 'Beginner Poomsae').
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class ModuleRead(ModuleBase):
    """
    Returned to clients in the frontend builder UI.
    """
    id: uuid.UUID
