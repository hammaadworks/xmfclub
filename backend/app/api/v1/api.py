from fastapi import APIRouter

from app.api.v1.endpoints import inventory, modules, payments, users, trainers, events, store

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(trainers.router, prefix="/trainers", tags=["Trainers"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(store.router, prefix="/store", tags=["Store"])
api_router.include_router(modules.router, prefix="/modules", tags=["Modules"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
