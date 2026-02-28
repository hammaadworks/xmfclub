from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.db import engine
from sqlmodel import SQLModel

# We import the models so that SQLModel's metadata registry knows about them.
import app.models.user
import app.models.module
import app.models.inventory
import app.models.payment
import app.models.event
import app.models.store

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[Any, None]:
    """
    Lifespan event handler. Runs setup code before the app starts accepting requests.
    In a real production app with Alembic, we wouldn't use `create_all` here,
    but it's good for bootstrapping the initial local development database.
    """
    async with engine.begin() as conn:
        # Create all tables (useful for first-time local setup)
        # Note: We will use Alembic for real migrations per Epic 1.
        # await conn.run_sync(SQLModel.metadata.create_all)
        pass
    
    yield
    
    # Cleanup on shutdown
    await engine.dispose()

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.db import engine
from sqlmodel import SQLModel

# ... (lifespan and model imports)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", response_class=JSONResponse, tags=["Health"])
# ...
async def health_check() -> dict[str, str]:
    """
    Basic health check endpoint to confirm the server is running.
    """
    return {"status": "ok", "message": "xmfclub API is fully operational"}
