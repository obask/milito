"""API routers."""

from app.routers.auth import router as auth_router
from app.routers.games import router as games_router
from app.routers.gameplay import router as gameplay_router
from app.routers.milito import router as milito_router

__all__ = [
    "auth_router",
    "games_router",
    "gameplay_router",
    "milito_router",
]
