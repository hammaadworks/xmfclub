import uuid
from typing import Optional
from datetime import datetime, timezone, date
from pydantic import EmailStr
from sqlmodel import Field, SQLModel, Column, String

class UserBase(SQLModel):
    """
    Base properties for the User model.
    """
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    role: str = Field(default="student", description="Role determines RBAC: 'admin', 'trainer', 'student'")
    is_active: bool = True
    
    # Specific fields for Students & Trainers
    belt_rank: str | None = Field(default=None, max_length=100)
    rfid_uuid: str | None = Field(
        default=None, 
        unique=True, 
        index=True, 
        description="Unique identifier printed onto the NFC/RFID card. Acts as a secure hardware link."
    )

class User(UserBase, table=True):
    """
    The main User database entity.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str = Field(max_length=255) # Assuming Better Auth might need this or we defer to Better Auth schema
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class UserCreate(UserBase):
    """
    Properties needed to create a new User.
    """
    password: str = Field(min_length=8, max_length=40)

class UserRead(UserBase):
    """
    Properties returned to clients. Hides sensitive information like hashed_password.
    """
    id: uuid.UUID
    created_at: datetime

class Attendance(SQLModel, table=True):
    """
    Tracks student attendance for specific class slots.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    inventory_slot_id: uuid.UUID = Field(foreign_key="inventorycapacity.id", index=True)
    attendance_date: date = Field(default_factory=date.today)
    is_present: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

class Media(SQLModel, table=True):
    """
    Stores references to training videos/photos stored on S3.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    trainer_id: uuid.UUID = Field(foreign_key="user.id")
    url: str = Field(max_length=512)
    media_type: str = Field(default="video") # video, photo
    caption: str | None = Field(default=None, max_length=255)
    is_public: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
