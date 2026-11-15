from fastapi import APIRouter

from app.api.v1 import aeolian, mars

api_v1_router = APIRouter()
api_v1_router.include_router(mars.router)
api_v1_router.include_router(aeolian.router)

__all__ = ["api_v1_router"]
