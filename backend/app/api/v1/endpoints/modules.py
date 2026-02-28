from typing import Any
import uuid
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep, AdminUserDep
from app.models.module import Module, ModuleRead, ModuleBase

router = APIRouter()

@router.get("/", response_model=list[ModuleRead])
async def read_modules(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all active training modules for the A la Carte builder.
    """
    statement = select(Module).where(Module.is_active == True).offset(skip).limit(limit)
    modules = await session.exec(statement)
    return modules.all()

@router.get("/{id}", response_model=ModuleRead)
async def read_module_by_id(
    id: uuid.UUID,
    session: SessionDep,
) -> Any:
    """
    Get a specific module's details.
    """
    module = await session.get(Module, id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

@router.post("/", response_model=ModuleRead)
async def create_module(
    module_in: ModuleBase,
    session: SessionDep,
    admin: AdminUserDep,
) -> Any:
    """
    Create new training module. Only admins can execute this.
    """
    module = Module.model_validate(module_in)
    session.add(module)
    await session.commit()
    await session.refresh(module)
    return module

@router.put("/{id}", response_model=ModuleRead)
async def update_module(
    id: uuid.UUID,
    module_in: ModuleBase,
    session: SessionDep,
    admin: AdminUserDep,
) -> Any:
    """
    Update a training module. Only admins can execute this.
    """
    module = await session.get(Module, id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    update_data = module_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(module, key, value)
        
    session.add(module)
    await session.commit()
    await session.refresh(module)
    return module

