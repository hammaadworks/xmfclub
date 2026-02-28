from typing import Any
import uuid
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SessionDep, get_current_user, CurrentUserDep, AdminUserDep
from app.models.user import User, UserRead
from app.core.security import decode_jwt_token

router = APIRouter()

@router.get("/", response_model=list[UserRead])
async def read_users(
    session: SessionDep,
    admin: AdminUserDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all users. Admin only.
    """
    statement = select(User).offset(skip).limit(limit)
    users = await session.exec(statement)
    return users.all()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: CurrentUserDep,
) -> Any:
    """
    Get current user profile (including role).
    """
    return current_user

@router.get("/rfid/{rfid_uuid}")
async def read_user_by_rfid(
    rfid_uuid: str,
    request: Request,
    session: SessionDep,
) -> Any:
    """
    Lookup a user by their RFID UUID.
    Implements RBAC: 
    - No Auth: Returns public profile (Brag Page).
    - Valid JWT: Returns full profile (Management Dashboard).
    """
    statement = select(User).where(User.rfid_uuid == rfid_uuid)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Check for authentication (Optional in this route)
    auth_header = request.headers.get("Authorization")
    is_authenticated = False
    current_user_id = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_jwt_token(token)
        if payload:
            current_user_id = payload.get("sub")
            # In a real app, we'd verify the user exists and is active/admin
            # For brevity, if valid JWT, we allow 'authenticated' view
            is_authenticated = True

    # Base Public Profile
    profile = {
        "full_name": user.full_name,
        "belt_rank": user.belt_rank,
        "role": user.role,
        "created_at": user.created_at,
    }

    # Add Private Data if Authenticated
    if is_authenticated:
        profile.update({
            "email": user.email,
            "is_active": user.is_active,
            "fee_status": "Current", # Mock logic
            "internal_notes": "Student is making great progress on Bo-Staff fundamentals."
        })

    return {
        "profile": profile,
        "is_authenticated": is_authenticated
    }

@router.post("/genesis-admin")
async def create_genesis_admin(
    rfid_uuid: str,
    secret: str,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> Any:
    """
    SYSTEM GENESIS: Promotes the currently logged-in user to an Admin and assigns an RFID.
    Requires a setup secret from the environment.
    """
    from app.core.config import settings
    
    # In a real app, use a dedicated GENESIS_SECRET. We'll use the generic secret for the demo.
    if secret != settings.SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid genesis secret")
        
    current_user.role = "admin"
    current_user.rfid_uuid = rfid_uuid
    session.add(current_user)
    await session.commit()
    
    return {
        "message": f"User {current_user.email} promoted to Super Admin.",
        "rfid_uuid": rfid_uuid,
        "role": current_user.role
    }
async def link_rfid_to_user(
    user_id: uuid.UUID,
    rfid_uuid: str,
    session: SessionDep,
    # admin: AdminUserDep, # Enforce admin in real app
) -> Any:
    """
    Links a physical RFID UUID to a student profile.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.rfid_uuid = rfid_uuid
    session.add(user)
    await session.commit()
    return {"message": f"RFID linked to {user.full_name}"}
