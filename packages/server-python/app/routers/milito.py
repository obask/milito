"""Milito game routes."""

import random
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game, GamePlayer, GameRoom, GameState
from app.models.user import User
from app.schemas.milito import DiscardRequest, SelectCardRequest, SelectColumnRequest

router = APIRouter(prefix="/milito", tags=["milito"])

# Game constants
MILITO_SELECT_CARD = "SELECT_CARD"
MILITO_SELECT_COLUMN = "SELECT_COLUMN"
MILITO_DISCARD = "DISCARD"

FACTIONS = ["ancient_british", "alexandrian_macedonian"]


def create_initial_table() -> dict:
    """Create an empty battlefield table."""
    return {
        "enemy_row_2": [None, None, None, None, None],
        "enemy_row_1": [None, None, None, None, None],
        "territory_row": [0, 0, 0, 0, 0],
        "player_row_1": [None, None, None, None, None],
        "player_row_2": [None, None, None, None, None],
    }


def create_initial_hand() -> list[int]:
    """Create initial hand with 5 random cards (0-4 are unit type indices)."""
    return [random.randint(0, 4) for _ in range(5)]


def create_player_state(player_id: str, faction: str) -> dict:
    """Create initial state for a player."""
    return {
        "oderId": player_id,
        "faction": faction,
        "table": create_initial_table(),
        "hand": create_initial_hand(),
        "phase": MILITO_SELECT_CARD,
        "cardsToDiscard": 0,
        "selectedCard": None,
        "selectedColumn": None,
        "discardedCards": [],
        "score": 0,
    }


@router.get("/{room_id}/state")
def get_milito_state(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Get the current Milito game state."""
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

    state = state_row.state
    my_state = state["players"].get(user.id)

    return {
        "room": {
            "id": room.id,
            "gameId": room.game_id,
            "name": room.name,
            "hostId": room.host_id,
            "status": room.status,
            "maxPlayers": room.max_players,
        },
        "gameState": state,
        "myState": my_state,
        "players": [
            {"id": p.id, "userId": p.user_id, "position": p.position, "score": p.score}
            for p in players
        ],
        "isMyTurn": state["currentPlayerId"] == user.id,
    }


@router.post("/{room_id}/initialize")
def initialize_milito(
    room_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Initialize the Milito game (host only)."""
    room = db.query(GameRoom).filter(GameRoom.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Verify this is a Milito room
    game = db.query(Game).filter(Game.id == room.game_id).first()
    if not game or game.id != "milito":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This room is not a Milito game",
        )

    if room.host_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host can initialize the game",
        )

    # Get players
    players = db.query(GamePlayer).filter(GamePlayer.room_id == room_id).all()

    if len(players) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Milito requires exactly 2 players",
        )

    # Create player states with assigned factions
    player_states = {}
    for idx, player in enumerate(players):
        player_states[player.user_id] = create_player_state(player.user_id, FACTIONS[idx])

    # Create initial game state
    initial_state = {
        "players": player_states,
        "currentPlayerId": players[0].user_id,
        "turnNumber": 1,
        "status": "playing",
    }

    # Upsert game state
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if state_row:
        state_row.state = initial_state
        state_row.current_turn = 1
        state_row.updated_at = datetime.utcnow()
    else:
        state_row = GameState(room_id=room_id, current_turn=1)
        state_row.state = initial_state
        db.add(state_row)

    # Update room status
    room.status = "playing"

    db.commit()
    return {"success": True}


@router.post("/{room_id}/select-card")
def select_card(
    room_id: str,
    body: SelectCardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Select a card from hand."""
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if not state_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not started",
        )

    state = state_row.state

    # Check if it's this player's turn
    if state["currentPlayerId"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not your turn",
        )

    player_state = state["players"][user.id]
    if player_state["phase"] != MILITO_SELECT_CARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in card selection phase",
        )

    if body.cardIndex < 0 or body.cardIndex >= len(player_state["hand"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid card index",
        )

    # Update player state
    player_state["selectedCard"] = body.cardIndex
    player_state["phase"] = MILITO_SELECT_COLUMN

    # Save state
    state_row.state = state
    state_row.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "state": state}


@router.post("/{room_id}/select-column")
def select_column(
    room_id: str,
    body: SelectColumnRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Select a column to place the card."""
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if not state_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not started",
        )

    state = state_row.state

    # Check if it's this player's turn
    if state["currentPlayerId"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not your turn",
        )

    player_state = state["players"][user.id]
    if player_state["phase"] != MILITO_SELECT_COLUMN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in column selection phase",
        )

    if body.columnIndex < 0 or body.columnIndex >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid column index",
        )

    # Update player state
    player_state["selectedColumn"] = body.columnIndex
    player_state["cardsToDiscard"] = 1
    player_state["phase"] = MILITO_DISCARD

    # Save state
    state_row.state = state
    state_row.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "state": state}


@router.post("/{room_id}/discard")
def discard_card(
    room_id: str,
    body: DiscardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Discard a card and complete the turn."""
    state_row = db.query(GameState).filter(GameState.room_id == room_id).first()
    if not state_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not started",
        )

    state = state_row.state

    # Check if it's this player's turn
    if state["currentPlayerId"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not your turn",
        )

    player_state = state["players"][user.id]
    if player_state["phase"] != MILITO_DISCARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in discard phase",
        )

    if body.cardIndex < 0 or body.cardIndex >= len(player_state["hand"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid card index",
        )

    # Can't discard the selected card
    if body.cardIndex == player_state["selectedCard"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot discard the card you are playing",
        )

    player_state["discardedCards"].append(body.cardIndex)
    player_state["cardsToDiscard"] -= 1

    if player_state["cardsToDiscard"] <= 0:
        # Execute the turn: place card on board
        card_value = player_state["hand"][player_state["selectedCard"]]
        column = player_state["selectedColumn"]

        # Place card in player_row_1 if empty, otherwise player_row_2
        if player_state["table"]["player_row_1"][column] is None:
            player_state["table"]["player_row_1"][column] = card_value
        elif player_state["table"]["player_row_2"][column] is None:
            player_state["table"]["player_row_2"][column] = card_value

        # Remove discarded and played cards from hand
        indices_to_remove = set(player_state["discardedCards"])
        indices_to_remove.add(player_state["selectedCard"])
        new_hand = [
            card
            for idx, card in enumerate(player_state["hand"])
            if idx not in indices_to_remove
        ]

        # Draw cards to get back to 5
        while len(new_hand) < 5:
            new_hand.append(random.randint(0, 4))

        player_state["hand"] = new_hand
        player_state["phase"] = MILITO_SELECT_CARD
        player_state["selectedCard"] = None
        player_state["selectedColumn"] = None
        player_state["discardedCards"] = []

        # Switch to other player
        player_ids = list(state["players"].keys())
        current_index = player_ids.index(user.id)
        state["currentPlayerId"] = player_ids[(current_index + 1) % len(player_ids)]
        state["turnNumber"] += 1

    # Save state
    state_row.state = state
    state_row.current_turn = state["turnNumber"]
    state_row.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "state": state}
