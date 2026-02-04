"""Milito game schemas."""

from typing import Optional

from pydantic import BaseModel


class MilitoPlayerTableResponse(BaseModel):
    """Response schema for player's battlefield table."""

    enemy_row_2: list[Optional[int]]
    enemy_row_1: list[Optional[int]]
    territory_row: list[int]
    player_row_1: list[Optional[int]]
    player_row_2: list[Optional[int]]


class MilitoPlayerStateResponse(BaseModel):
    """Response schema for a player's state in Milito."""

    oderId: str
    faction: str
    table: MilitoPlayerTableResponse
    hand: list[int]
    phase: str
    cardsToDiscard: int
    selectedCard: Optional[int] = None
    selectedColumn: Optional[int] = None
    discardedCards: list[int]
    score: int


class MilitoGameStateResponse(BaseModel):
    """Response schema for Milito game state."""

    players: dict[str, MilitoPlayerStateResponse]
    currentPlayerId: str
    turnNumber: int
    status: str
    winnerId: Optional[str] = None


class MilitoStateResponse(BaseModel):
    """Response schema for complete Milito state."""

    room: dict
    gameState: MilitoGameStateResponse
    myState: MilitoPlayerStateResponse
    players: list[dict]
    isMyTurn: bool


class SelectCardRequest(BaseModel):
    """Request schema for selecting a card."""

    cardIndex: int


class SelectColumnRequest(BaseModel):
    """Request schema for selecting a column."""

    columnIndex: int


class DiscardRequest(BaseModel):
    """Request schema for discarding a card."""

    cardIndex: int
