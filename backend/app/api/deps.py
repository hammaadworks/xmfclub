import uuid
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.security import decode_jwt_token
from app.models.user import User

# In a decoupled architecture where Better Auth handles the login form,
# this OAuth2PasswordBearer is primarily used to tell FastAPI (and Swagger UI)
# to look for the "Authorization: Bearer <token>" header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

# Reusable Type Aliases (FastAPI Best Practice)
SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

async def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """
    Validates the JWT token cryptographically and returns the current User object.
    If the JWT is valid but the user doesn't exist in our DB (because Better Auth
    created them in a decoupled service), we auto-provision the local DB record.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_jwt_token(token)
    if payload is None:
        raise credentials_exception
        
    # Better Auth's session/user ID logic might use 'sub' or 'userId'
    user_id_str: str | None = payload.get("sub") or payload.get("userId")
    email: str | None = payload.get("email")
    name: str | None = payload.get("name")
    
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    # Fetch or Auto-Provision
    user = await session.get(User, user_id)
    if user is None:
        if not email:
            # Fallback if email isn't in JWT payload
            email = f"{user_id_str}@temp.xmfclub.com"
            
        # Auto-provision the user from the trusted JWT
        user = User(
            id=user_id,
            email=email,
            full_name=name or "New Athlete",
            role="student",
            is_active=True,
            hashed_password="decoupled_auth_provider", # Handled by Better Auth
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

CurrentUserDep = Annotated[User, Depends(get_current_user)]

def _check_user_role(user: User, required_roles: list[str]) -> User:
    """Helper to enforce role-based access control."""
    if user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"The user doesn't have enough privileges. Requires one of: {required_roles}",
        )
    return user

async def get_current_admin_user(current_user: CurrentUserDep) -> User:
    """Dependency that enforces Admin-only access."""
    return _check_user_role(current_user, ["admin"])

async def get_current_trainer_or_admin(current_user: CurrentUserDep) -> User:
    """Dependency that enforces Trainer or Admin access."""
    return _check_user_role(current_user, ["admin", "trainer"])

AdminUserDep = Annotated[User, Depends(get_current_admin_user)]
TrainerUserDep = Annotated[User, Depends(get_current_trainer_or_admin)]
