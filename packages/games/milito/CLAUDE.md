# Milito Game - Claude Code Instructions

## Overview
Milito is a 2-player ancient warfare card game. Players command armies (Alexandrian Macedonian or Ancient British) and battle for territory control.

## File Locations
```
games/milito/
├── server/
│   └── routes.ts      # All /api/milito/* endpoints
├── client/
│   ├── routes/
│   │   └── room.tsx   # Game room UI
│   └── components/
│       ├── MilitoBoard.tsx
│       ├── MilitoCard.tsx
│       ├── MilitoGame.tsx
│       └── MilitoHand.tsx
├── shared/
│   └── types.ts       # MilitoGameState, MilitoPlayerState
└── CLAUDE.md          # This file
```

## Game Rules

### Setup
- 2 players, each assigned a faction
- Each player starts with 5 cards in hand
- 5x5 grid board per player

### Turn Phases
1. **SELECT_CARD**: Choose a card from hand to play
2. **SELECT_COLUMN**: Choose which column (0-4) to place card
3. **DISCARD**: Discard 1 card from hand

### Card Placement
- Cards placed in `player_row_1` first (closest to territory)
- If row full, placed in `player_row_2`
- After turn, draw back to 5 cards

### Board Layout (per player perspective)
```
enemy_row_2:    [ ][ ][ ][ ][ ]   <- Furthest enemy row
enemy_row_1:    [ ][ ][ ][ ][ ]   <- Near enemy row
territory_row:  [0][0][0][0][0]   <- Contested territory (scores)
player_row_1:   [ ][ ][ ][ ][ ]   <- Your front row
player_row_2:   [ ][ ][ ][ ][ ]   <- Your back row
```

### Unit Types
```typescript
const MILITO_UNIT_TYPES = [
  'light_cavalry',
  'slingers',
  'leader_2',
  'chariots',
  'heavy_cavalry',
] as const
```

### Factions
- `alexandrian_macedonian` - Macedonian army
- `ancient_british` - British tribal army

## State Machine

```
SELECT_CARD → SELECT_COLUMN → DISCARD → (next player) → SELECT_CARD
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/milito/:roomId/state` | Get current game state |
| POST | `/api/milito/:roomId/initialize` | Start game (host only) |
| POST | `/api/milito/:roomId/select-card` | Select card from hand |
| POST | `/api/milito/:roomId/select-column` | Choose placement column |
| POST | `/api/milito/:roomId/discard` | Discard to end turn |

## Types Reference

```typescript
interface MilitoGameState {
  players: Record<string, MilitoPlayerState>
  currentPlayerId: string
  turnNumber: number
  status: 'playing' | 'finished'
  winnerId?: string
}

interface MilitoPlayerState {
  oderId: string
  faction: MilitoFaction
  table: MilitoPlayerTable
  hand: number[]              // Card indices (0-4 = unit types)
  phase: MilitoPhase
  cardsToDiscard: number
  selectedCard?: number       // Index in hand
  selectedColumn?: number     // 0-4
  discardedCards: number[]
  score: number
}

interface MilitoPlayerTable {
  enemy_row_2: (number | null)[]
  enemy_row_1: (number | null)[]
  territory_row: number[]
  player_row_1: (number | null)[]
  player_row_2: (number | null)[]
}
```

## Assets
Located at `public/assets/milito/`:
- `alexandrian_macedonian/` - AM faction images
- `ancient_british/` - AB faction images
- `plain.jpeg` - Background

## TODO / Known Issues
- [ ] Combat resolution not implemented
- [ ] Territory scoring not implemented
- [ ] Win condition not implemented
- [ ] Card abilities not differentiated

## Development Commands
```bash
# From repo root
pnpm dev                    # Run full app
pnpm test games/milito      # Run milito tests (when added)
```
