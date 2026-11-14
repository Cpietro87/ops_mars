from fastapi import APIRouter

from app.api.v1 import mars

api_v1_router = APIRouter()
api_v1_router.include_router(mars.router)

__all__ = ["api_v1_router"]
