# Lightweight Platform Refactoring Plan

## Goal
Separate platform (auth, rooms) from games (milito, memory-match) so each game can be developed in isolation with focused Claude Code context.

## Target Structure

```
packages/
├── platform/
│   ├── server/
│   │   ├── index.ts              # Elysia app, mounts plugins
│   │   ├── env.ts                # Environment config
│   │   ├── db/
│   │   │   ├── index.ts          # DB client
│   │   │   └── schema.ts         # Core tables only
│   │   ├── lib/
│   │   │   └── auth.ts           # Better-Auth config
│   │   ├── middleware/
│   │   │   └── auth.ts           # Auth middleware
│   │   └── routes/
│   │       └── games.ts          # Room CRUD (no game logic)
│   │
│   ├── client/
│   │   ├── api.ts                # Eden client
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── components/
│   │   │   └── ui/               # Shadcn components
│   │   └── routes/
│   │       ├── __root.tsx        # Shell layout
│   │       ├── index.tsx         # Home
│   │       ├── login.tsx
│   │       ├── register.tsx
│   │       ├── dashboard.tsx
│   │       ├── games.tsx         # Game gallery
│   │       └── lobby.tsx         # Room list
│   │
│   └── shared/
│       └── types/
│           ├── user.ts
│           └── auth.ts
│
└── games/
    ├── milito/
    │   ├── server/
    │   │   └── routes.ts         # /api/milito/* endpoints
    │   ├── client/
    │   │   ├── routes/
    │   │   │   └── room.$roomId.tsx
    │   │   └── components/
    │   │       ├── MilitoBoard.tsx
    │   │       ├── MilitoCard.tsx
    │   │       ├── MilitoGame.tsx
    │   │       └── MilitoHand.tsx
    │   ├── shared/
    │   │   └── types.ts          # MilitoGameState, etc.
    │   └── CLAUDE.md             # Game-specific instructions
    │
    └── memory-match/
        ├── server/
        │   └── routes.ts
        ├── client/
        │   ├── routes/
        │   │   └── room.$roomId.tsx
        │   └── components/
        │       └── MemoryBoard.tsx
        ├── shared/
        │   └── types.ts
        └── CLAUDE.md

```

## Game Plugin Interface

```typescript
// packages/platform/server/game-plugin.ts
import { Elysia } from 'elysia'

export interface GamePlugin {
  id: string
  routes: Elysia
}

export function mountGame(app: Elysia, plugin: GamePlugin) {
  return app.use(plugin.routes)
}
```

## Migration Steps

### Phase 1: Create platform structure
- [ ] Create `packages/platform/` directory
- [ ] Move core server files (db, auth, middleware)
- [ ] Move core client files (api, useAuth, ui components)
- [ ] Move shared auth/user types
- [ ] Update imports

### Phase 2: Create games structure
- [ ] Create `packages/games/milito/`
- [ ] Move milito routes, components, types
- [ ] Create milito CLAUDE.md
- [ ] Create `packages/games/memory-match/`
- [ ] Move gameplay routes, components
- [ ] Create memory-match CLAUDE.md

### Phase 3: Wire up plugins
- [ ] Create GamePlugin interface
- [ ] Update platform index.ts to mount game routes
- [ ] Update client routing to load game components
- [ ] Test both games work

### Phase 4: Update tooling
- [ ] Update package.json scripts
- [ ] Update tsconfig paths
- [ ] Update vite config for game aliases
- [ ] Test `pnpm dev` runs everything

## Platform Database Schema (core only)

```typescript
// These stay in platform
- user
- session
- account
- verification
- games        // Game registry
- gameRooms    // Room management
- gamePlayers  // Player positions
- gameState    // JSON blob (game-agnostic)
```

## Client Routing Strategy

Platform handles shell routes, games inject their room route:

```typescript
// platform/client/routes/__root.tsx
// Provides: /, /login, /register, /games, /lobby, /dashboard

// games/milito/client/routes/room.$roomId.tsx
// Injected at: /room/:roomId (when game=milito)
```

Option A: Dynamic import based on game type
Option B: All game room routes bundled, switch by game ID

## Worktree Strategy After Refactor

```bash
# Platform development
cd arena-platform && claude

# Milito development (focused)
git worktree add ../arena-milito -b game/milito
cd ../arena-milito && claude
# CLAUDE.md points to games/milito/ only

# Memory Match development
git worktree add ../arena-memory -b game/memory-match
cd ../arena-memory && claude
```

## Files to Move

### To platform/server/
- src/index.ts (modify to mount plugins)
- src/env.ts
- src/db/*
- src/lib/auth.ts
- src/middleware/auth.ts
- src/routes/games.ts

### To platform/client/
- src/lib/api.ts
- src/hooks/useAuth.ts
- src/components/ui/*
- src/routes/__root.tsx
- src/routes/index.tsx
- src/routes/login.tsx
- src/routes/register.tsx
- src/routes/dashboard.tsx
- src/routes/games.tsx
- src/routes/lobby.tsx

### To games/milito/
- src/routes/milito.ts → server/routes.ts
- src/components/milito/* → client/components/
- src/routes/room.$roomId.tsx → client/routes/ (milito parts)
- shared/types/milito.ts → shared/types.ts

### To games/memory-match/
- src/routes/gameplay.ts → server/routes.ts
- src/routes/room.$roomId.tsx → client/routes/ (memory parts)
- New: shared/types.ts for MemoryMatchState
