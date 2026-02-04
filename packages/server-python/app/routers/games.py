"""Game and room routes."""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game, GamePlayer, GameRoom, GameState
from app.models.user import User
from app.schemas.game import (
    GameResponse,
    PlayerResponse,
    RoomCreate,
    RoomListResponse,
    RoomResponse,
)

router = APIRouter(prefix="/games", tags=["games"])


def _game_to_response(game: Game) -> GameResponse:
    """Convert Game model to GameResponse."""
    return GameResponse(
        id=game.id,
        name=game.name,
        description=game.description,
        minPlayers=game.min_players,
        maxPlayers=game.max_players,
        imageUrl=game.image_url,
        createdAt=game.created_at,
    )


def _player_to_response(player: GamePlayer) -> PlayerResponse:
    """Convert GamePlayer model to PlayerResponse."""
    return PlayerResponse(
        id=player.id,
        userId=player.user_id,
        position=player.position,
        score=player.score,
    )


@router.get("/", response_model=list[GameResponse])
def list_games(db: Session = Depends(get_db)) -> list[GameResponse]:
    """List all available games."""
    games = db.query(Game).all()
    return [_game_to_response(g) for g in games]


@router.get("/rooms", response_model=list[RoomListResponse])
def list_rooms(
    game_id: Optional[str] = Query(None, alias="gameId"),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
) -> list[RoomListResponse]:
    """List rooms with optional filters."""
    query = (
        db.query(
            GameRoom.id,
            GameRoom.name,
            GameRoom.game_id,
            Game.name.label("game_name"),
            Game.image_url.label("game_image"),
            GameRoom.host_id,
            GameRoom.status,
            GameRoom.max_players,
            GameRoom.created_at,
            func.count(GamePlayer.id).label("player_count"),
        )
        .outerjoin(Game, GameRoom.game_id == Game.id)
        .outerjoin(GamePlayer, GameRoom.id == GamePlayer.room_id)
        .group_by(GameRoom.id)
    )

    if game_id:
        query = query.filter(GameRoom.game_id == game_id)

    if status_filter:
        query = query.filter(GameRoom.status == status_filter)

    results = query.all()

    return [
        RoomListResponse(
            id=r.id,
            name=r.name,
            gameId=r.game_id,
            gameName=r.game_name,
            gameImage=r.game_image,
            hostId=r.host_id,
            status=r.status,
            maxPlayers=r.max_players,
            playerCount=r.player_count,
            createdAt=r.created_at,
        )
        for r in results
    ]


@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: str, db: Session = Depends(get_db)) -> RoomResponse:
    """Get room details with players."""
    room = db.query(GameRoom).filter(GameRoom.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    players = (
        db.query(GamePlayer)
        .filter(GamePlayer.room_id == room_id)
        .order_by(GamePlayer.position)
        .all()
    )

    return RoomResponse(
        id=room.id,
        name=room.name,
        gameId=room.game_id,
        hostId=room.host_id,
        status=room.status,
        maxPlayers=room.max_players,
        createdAt=room.created_at,
        startedAt=room.started_at,
        finishedAt=room.finished_at,
        players=[_player_to_response(p) for p in players],
    )


@router.post("/rooms", response_model=dict)
def create_room(
    room_data: RoomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Create a new room."""
    # Verify game exists
    game = db.query(Game).filter(Game.id == room_data.gameId).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    room_id = str(uuid4()).replace("-", "")

    # Create room
    room = GameRoom(
        id=room_id,
        game_id=room_data.gameId,
        name=room_data.name,
        host_id=user.id,
        status="waiting",
        max_players=room_data.maxPlayers,
    )
    db.add(room)

    # Add host as first player
    player = GamePlayer(
        id=str(uuid4()).replace("-", ""),
        room_id=room_id,
        user_id=user.id,
        position=0,
    )
    db.add(player)

    db.commit()
    return {"roomId": room_id}


@router.post("/rooms/{room_id}/join", response_model=dict)
def join_room(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Join a room."""
    room = db.query(GameRoom).filter(GameRoom.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if room.status != "waiting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game already started",
        )

    # Check if already in room
    existing = (
        db.query(GamePlayer)
        .filter(GamePlayer.room_id == room_id, GamePlayer.user_id == user.id)
        .first()
    )
    if existing:
        return {"success": True, "message": "Already in room"}

    # Check room capacity
    player_count = db.query(GamePlayer).filter(GamePlayer.room_id == room_id).count()
    if player_count >= room.max_players:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is full",
        )

    # Add player
    player = GamePlayer(
        id=str(uuid4()).replace("-", ""),
        room_id=room_id,
        user_id=user.id,
        position=player_count,
    )
    db.add(player)
    db.commit()

    return {"success": True}


@router.post("/rooms/{room_id}/leave", response_model=dict)
def leave_room(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Leave a room."""
    db.query(GamePlayer).filter(
        GamePlayer.room_id == room_id, GamePlayer.user_id == user.id
    ).delete()
    db.commit()
    return {"success": True}


@router.post("/rooms/{room_id}/start", response_model=dict)
def start_game(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Start a game (host only)."""
    room = db.query(GameRoom).filter(GameRoom.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if room.host_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host can start the game",
        )

    if room.status != "waiting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game already started",
        )

    # Check player count
    player_count = db.query(GamePlayer).filter(GamePlayer.room_id == room_id).count()
    game = db.query(Game).filter(Game.id == room.game_id).first()

    if player_count < game.min_players:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Need at least {game.min_players} players to start",
        )

    # Update room status
    room.status = "playing"
    room.started_at = datetime.utcnow()

    # Create initial empty game state
    state = GameState(
        room_id=room_id,
        current_turn=0,
    )
    state.state = {"cards": [], "flipped": [], "matched": []}
    db.add(state)

    db.commit()
    return {"success": True}


@router.get("/{game_id}", response_model=GameResponse)
def get_game(game_id: str, db: Session = Depends(get_db)) -> GameResponse:
    """Get a specific game by ID."""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )
    return _game_to_response(game)
