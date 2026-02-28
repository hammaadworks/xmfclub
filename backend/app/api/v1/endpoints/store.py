from typing import Any
import uuid
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.api.deps import SessionDep
from app.models.store import Product

router = APIRouter()

@router.get("/")
async def read_products(
    session: SessionDep,
    brand: str | None = Query(default=None),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Returns products for the Storefront Grid.
    """
    statement = select(Product).where(Product.is_active == True)
    if brand:
        statement = statement.where(Product.brand == brand)
        
    statement = statement.offset(skip).limit(limit)
    result = await session.exec(statement)
    return result.all()

@router.get("/{id}")
async def read_product_by_id(
    id: uuid.UUID,
    session: SessionDep,
) -> Any:
    """
    Fetch a single product detail for the Reels-style view.
    """
    product = await session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
