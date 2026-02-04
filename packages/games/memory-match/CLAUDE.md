# Memory Match Game - Claude Code Instructions

## Overview
Memory Match is a 2-4 player card matching game. Players take turns flipping cards to find matching pairs.

## File Locations
```
games/memory-match/
├── server/
│   └── routes.ts      # All /api/gameplay/* endpoints
├── client/
│   ├── routes/
│   │   └── room.tsx   # Game room UI
│   └── components/
│       └── MemoryBoard.tsx
├── shared/
│   └── types.ts       # MemoryCard, MemoryMatchState
└── CLAUDE.md          # This file
```

## Game Rules

### Setup
- 2-4 players
- 16 cards (8 emoji pairs) in a 4x4 grid
- Cards start face-down

### Turn Flow
1. Player flips first card (revealed)
2. Player flips second card (revealed)
3. If match: cards stay face-up, player scores +1, same player continues
4. If no match: cards flip back face-down, next player's turn

### Win Condition
- Game ends when all pairs are matched
- Player with most pairs wins

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gameplay/:roomId/state` | Get current game state |
| POST | `/api/gameplay/:roomId/initialize` | Start game (host only) |
| POST | `/api/gameplay/:roomId/flip` | Flip a card |
| POST | `/api/gameplay/:roomId/reset` | Reset flipped cards (end turn) |

## Types Reference

```typescript
interface MemoryCard {
  id: number
  value: string       // Emoji symbol
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryMatchState {
  cards: MemoryCard[]
  flippedIndices: number[]        // Currently flipped (0-2)
  matchedPairs: number
  currentPlayerPosition: number   // 0-indexed position
  scores: { [position: number]: number }
}
```

## Card Symbols
```
🎮 🎯 🎲 🎪 🎨 🎭 🎬 🎸
```

## Development Commands
```bash
pnpm dev                      # Run full app
pnpm test games/memory-match  # Run tests (when added)
```
