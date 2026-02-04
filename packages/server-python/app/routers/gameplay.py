"""Memory Match gameplay routes."""

import random
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.game import GamePlayer, GameRoom, GameState
from app.models.user import User
from app.schemas.gameplay import FlipCardRequest

router = APIRouter(prefix="/gameplay", tags=["gameplay"])

# Emoji symbols for the memory game
SYMBOLS = ["🎮", "🎯", "🎲", "🎪", "🎨", "🎭", "🎬", "🎸", "🎹", "🎤", "🎧", "🎼"]


def create_memory_deck(pairs: int = 8) -> list[dict]:
    """Create a shuffled deck of memory cards."""
    selected_symbols = SYMBOLS[:pairs]
    cards = []

    for idx, symbol in enumerate(selected_symbols):
        cards.append({"id": idx * 2, "value": symbol, "isFlipped": False, "isMatched": False})
        cards.append({"id": idx * 2 + 1, "value": symbol, "isFlipped": False, "isMatched": False})

    random.shuffle(cards)
    return cards


@router.get("/{room_id}/state")
def get_game_state(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Get the current game state."""
    # Verify player is in the room
    player = (
        db.query(GamePlayer)
        .filter(GamePlayer.room_id == room_id, GamePlayer.user_id == user.id)
        .first()
    )
    if not player:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not in this room",
        )

    # Get game state
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if not state_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not started yet",
        )

    # Get room
    room = db.query(GameRoom).filter(GameRoom.id == room_id).first()

    # Get all players
    players = (
        db.query(GamePlayer)
        .filter(GamePlayer.room_id == room_id)
        .order_by(GamePlayer.position)
        .all()
    )

    return {
        "room": {
            "id": room.id,
            "gameId": room.game_id,
            "name": room.name,
            "hostId": room.host_id,
            "status": room.status,
            "maxPlayers": room.max_players,
        },
        "state": state_row.state,
        "players": [
            {"id": p.id, "userId": p.user_id, "position": p.position, "score": p.score}
            for p in players
        ],
        "currentPlayerPosition": player.position,
    }


@router.post("/{room_id}/initialize")
def initialize_game(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Initialize the memory match game (host only)."""
    room = db.query(GameRoom).filter(GameRoom.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if room.host_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host can initialize the game",
        )

    # Get players
    players = db.query(GamePlayer).filter(GamePlayer.room_id == room_id).all()

    # Initialize scores
    scores = {str(p.position): 0 for p in players}

    # Create initial state
    initial_state = {
        "cards": create_memory_deck(8),
        "flippedIndices": [],
        "matchedPairs": 0,
        "currentPlayerPosition": 0,
        "scores": scores,
    }

    # Upsert game state
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if state_row:
        state_row.state = initial_state
        state_row.current_turn = 0
        state_row.updated_at = datetime.utcnow()
    else:
        state_row = GameState(room_id=room_id, current_turn=0)
        state_row.state = initial_state
        db.add(state_row)

    db.commit()
    return {"success": True}


@router.post("/{room_id}/flip")
def flip_card(
    room_id: str,
    body: FlipCardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Flip a card."""
    # Verify player is in the room
    player = (
        db.query(GamePlayer)
        .filter(GamePlayer.room_id == room_id, GamePlayer.user_id == user.id)
        .first()
    )
    if not player:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not in this room",
        )

    # Get game state
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if not state_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not started",
        )

    state = state_row.state

    # Check if it's this player's turn
    if state["currentPlayerPosition"] != player.position:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not your turn",
        )

    # Check if already 2 cards flipped
    if len(state["flippedIndices"]) >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please reset flipped cards first",
        )

    # Find card index
    card_index = next(
        (i for i, c in enumerate(state["cards"]) if c["id"] == body.cardId), None
    )
    if card_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found",
        )

    card = state["cards"][card_index]
    if card["isMatched"] or card["isFlipped"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Card already flipped or matched",
        )

    # Flip the card
    state["cards"][card_index]["isFlipped"] = True
    state["flippedIndices"].append(card_index)

    # Check for match if 2 cards flipped
    if len(state["flippedIndices"]) == 2:
        idx1, idx2 = state["flippedIndices"]
        card1 = state["cards"][idx1]
        card2 = state["cards"][idx2]

        if card1["value"] == card2["value"]:
            # Match found
            state["cards"][idx1]["isMatched"] = True
            state["cards"][idx2]["isMatched"] = True
            state["matchedPairs"] += 1
            state["scores"][str(player.position)] = (
                state["scores"].get(str(player.position), 0) + 1
            )

            # Update player score in database
            player.score = state["scores"][str(player.position)]

            # Check if game is finished
            if state["matchedPairs"] == len(state["cards"]) // 2:
                room = db.query(GameRoom).filter(GameRoom.id == room_id).first()
                room.status = "finished"
                room.finished_at = datetime.utcnow()

    # Save state
    state_row.state = state
    state_row.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "state": state}


@router.post("/{room_id}/reset")
def reset_flipped(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Reset unmatched flipped cards and advance turn."""
    # Verify player is in the room
    player = (
        db.query(GamePlayer)
        .filter(GamePlayer.room_id == room_id, GamePlayer.user_id == user.id)
        .first()
    )
    if not player:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not in this room",
        )

    # Get game state
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if not state_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not started",
        )

    state = state_row.state

    # Check if it's this player's turn
    if state["currentPlayerPosition"] != player.position:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not your turn",
        )

    # If 2 cards flipped and not matched, flip them back and advance turn
    if len(state["flippedIndices"]) == 2:
        idx1, idx2 = state["flippedIndices"]
        card1 = state["cards"][idx1]
        card2 = state["cards"][idx2]

        if card1["value"] != card2["value"]:
            state["cards"][idx1]["isFlipped"] = False
            state["cards"][idx2]["isFlipped"] = False

            # Get player count
            player_count = (
                db.query(GamePlayer).filter(GamePlayer.room_id == room_id).count()
            )
            state["currentPlayerPosition"] = (
                state["currentPlayerPosition"] + 1
            ) % player_count

    # Clear flipped indices
    state["flippedIndices"] = []

    # Save state
    state_row.state = state
    state_row.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "state": state}
