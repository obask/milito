"""Memory Match gameplay schemas."""

from typing import Any, Optional

from pydantic import BaseModel


class MemoryCardResponse(BaseModel):
    """Response schema for a memory card."""

    id: int
    value: str
    isFlipped: bool
    isMatched: bool


class MemoryMatchStateResponse(BaseModel):
    """Response schema for Memory Match game state."""

    cards: list[MemoryCardResponse]
    flippedIndices: list[int]
    matchedPairs: int
    currentPlayerPosition: int
    scores: dict[str, int]


class RoomStateResponse(BaseModel):
    """Response schema for room info in game state."""

    id: str
    gameId: str
    name: str
    hostId: str
    status: str
    maxPlayers: int


class PlayerStateResponse(BaseModel):
    """Response schema for player in game state."""

    id: str
    userId: str
    position: int
    score: int


class GameStateResponse(BaseModel):
    """Response schema for complete game state."""

    room: RoomStateResponse
    state: MemoryMatchStateResponse
    players: list[PlayerStateResponse]
    currentPlayerPosition: int


class FlipCardRequest(BaseModel):
    """Request schema for flipping a card."""

    cardId: int
