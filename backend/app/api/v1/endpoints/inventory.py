from typing import Any
import uuid
from fastapi import APIRouter, Query, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep, AdminUserDep
from app.models.inventory import InventoryCapacity, InventoryRead, InventoryCapacityBase

router = APIRouter()

@router.get("/", response_model=list[InventoryRead])
async def read_inventory(
    session: SessionDep,
    module_id: uuid.UUID | None = Query(default=None),
    trainer_id: uuid.UUID | None = Query(default=None),
) -> Any:
    """
    Retrieve class availability. 
    Crucial for the A la Carte builder to show real-time slot statuses.
    """
    statement = select(InventoryCapacity).where(InventoryCapacity.is_active == True)
    
    if module_id:
        statement = statement.where(InventoryCapacity.module_id == module_id)
    if trainer_id:
        statement = statement.where(InventoryCapacity.trainer_id == trainer_id)
        
    result = await session.exec(statement)
    slots = result.all()
    
    # Hydrate the 'is_full' field for the InventoryRead model
    return [
        InventoryRead(
            **slot.model_dump(),
            is_full=(slot.current_enrollment >= slot.max_capacity)
        )
        for slot in slots
    ]

@router.post("/", response_model=InventoryRead)
async def create_inventory_slot(
    slot_in: InventoryCapacityBase,
    session: SessionDep,
    admin: AdminUserDep,
) -> Any:
    """
    Create a new class schedule slot. Admin only.
    """
    slot = InventoryCapacity.model_validate(slot_in)
    session.add(slot)
    await session.commit()
    await session.refresh(slot)
    
    return InventoryRead(
        **slot.model_dump(),
        is_full=(slot.current_enrollment >= slot.max_capacity)
    )

@router.put("/{id}", response_model=InventoryRead)
async def update_inventory_slot(
    id: uuid.UUID,
    slot_in: InventoryCapacityBase,
    session: SessionDep,
    admin: AdminUserDep,
) -> Any:
    """
    Update an existing class schedule slot. Admin only.
    """
    slot = await session.get(InventoryCapacity, id)
    if not slot:
        raise HTTPException(status_code=404, detail="Inventory slot not found")
        
    update_data = slot_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(slot, key, value)
        
    session.add(slot)
    await session.commit()
    await session.refresh(slot)
    
    return InventoryRead(
        **slot.model_dump(),
        is_full=(slot.current_enrollment >= slot.max_capacity)
    )
