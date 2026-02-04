"""Game and room models."""

import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Game(Base):
    """Game model - available games in the platform."""

    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    min_players: Mapped[int] = mapped_column(Integer, nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    rooms: Mapped[list["GameRoom"]] = relationship(
        "GameRoom", back_populates="game", cascade="all, delete-orphan"
    )


class GameRoom(Base):
    """Game room model - instances of games being played."""

    __tablename__ = "game_rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    host_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="waiting", nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="rooms")
    players: Mapped[list["GamePlayer"]] = relationship(
        "GamePlayer", back_populates="room", cascade="all, delete-orphan"
    )
    state: Mapped[Optional["GameState"]] = relationship(
        "GameState", back_populates="room", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("game_rooms_gameId_idx", "game_id"),
        Index("game_rooms_hostId_idx", "host_id"),
        Index("game_rooms_status_idx", "status"),
    )


class GamePlayer(Base):
    """Game player model - players in a room."""

    __tablename__ = "game_players"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    room_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("game_rooms.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    room: Mapped["GameRoom"] = relationship("GameRoom", back_populates="players")

    __table_args__ = (
        Index("game_players_roomId_idx", "room_id"),
        Index("game_players_userId_idx", "user_id"),
    )


class GameState(Base):
    """Game state model - JSON blob for game-specific state."""

    __tablename__ = "game_state"

    room_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("game_rooms.id", ondelete="CASCADE"), primary_key=True
    )
    _state: Mapped[str] = mapped_column("state", Text, nullable=False)
    current_turn: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    room: Mapped["GameRoom"] = relationship("GameRoom", back_populates="state")

    @property
    def state(self) -> Any:
        """Get parsed state JSON."""
        return json.loads(self._state)

    @state.setter
    def state(self, value: Any) -> None:
        """Set state as JSON string."""
        self._state = json.dumps(value)
