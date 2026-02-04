"""Pydantic schemas for request/response validation."""

from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    SessionResponse,
)
from app.schemas.game import (
    GameResponse,
    RoomCreate,
    RoomResponse,
    RoomListResponse,
    PlayerResponse,
)
from app.schemas.gameplay import (
    MemoryCardResponse,
    MemoryMatchStateResponse,
    GameStateResponse,
    FlipCardRequest,
)
from app.schemas.milito import (
    MilitoPlayerTableResponse,
    MilitoPlayerStateResponse,
    MilitoGameStateResponse,
    MilitoStateResponse,
    SelectCardRequest,
    SelectColumnRequest,
    DiscardRequest,
)

__all__ = [
    # Auth
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "SessionResponse",
    # Game
    "GameResponse",
    "RoomCreate",
    "RoomResponse",
    "RoomListResponse",
    "PlayerResponse",
    # Gameplay
    "MemoryCardResponse",
    "MemoryMatchStateResponse",
    "GameStateResponse",
    "FlipCardRequest",
    # Milito
    "MilitoPlayerTableResponse",
    "MilitoPlayerStateResponse",
    "MilitoGameStateResponse",
    "MilitoStateResponse",
    "SelectCardRequest",
    "SelectColumnRequest",
    "DiscardRequest",
]
