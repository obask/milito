"""Game and room schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GameResponse(BaseModel):
    """Response schema for a game."""

    id: str
    name: str
    description: str
    minPlayers: int
    maxPlayers: int
    imageUrl: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class PlayerResponse(BaseModel):
    """Response schema for a player in a room."""

    id: str
    userId: str
    position: int
    score: int


class RoomCreate(BaseModel):
    """Request schema for creating a room."""

    gameId: str
    name: str = Field(min_length=1, max_length=50)
    maxPlayers: int = Field(ge=2, le=6)


class RoomResponse(BaseModel):
    """Response schema for a room with details."""

    id: str
    name: str
    gameId: str
    hostId: str
    status: str
    maxPlayers: int
    createdAt: datetime
    startedAt: Optional[datetime] = None
    finishedAt: Optional[datetime] = None
    players: list[PlayerResponse] = []


class RoomListResponse(BaseModel):
    """Response schema for room listing."""

    id: str
    name: str
    gameId: str
    gameName: Optional[str] = None
    gameImage: Optional[str] = None
    hostId: str
    status: str
    maxPlayers: int
    playerCount: int
    createdAt: datetime
