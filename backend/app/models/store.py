import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

class ProductBase(SQLModel):
    """
    Base properties for a Store Product (Merch or Affiliate).
    """
    name: str = Field(index=True, max_length=255)
    description: str | None = Field(default=None)
    price: float = Field(default=0.0)
    
    # Media for Grid and Reels
    thumbnail_url: str = Field(max_length=512)
    video_url: str = Field(max_length=512, description="Short TikTok/Reel style review video.")
    
    # Affiliate/Purchase Logic
    buy_url: str = Field(max_length=512, description="Amazon/Decathlon affiliate link or Stripe checkout.")
    is_affiliate: bool = Field(default=True)
    brand: str = Field(default="XMF", max_length=100) # Decathlon, Amazon, XMF
    
    is_active: bool = Field(default=True)

class Product(ProductBase, table=True):
    """
    The actual Product entry.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
