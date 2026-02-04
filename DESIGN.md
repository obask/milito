# Bestagon Arena - High-Level Design

## Overview

Bestagon Arena is a multiplayer board game platform that enables real-time game rooms, lobbies, and turn-based gameplay. The platform is designed to host multiple games with a shared infrastructure for user management, room creation, and game state persistence.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client (React)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  TanStack    │  │   TanStack   │  │    Game Components       │  │
│  │   Router     │  │    Query     │  │  (MilitoGame, etc.)      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                       │                 │
│         └─────────────────┼───────────────────────┘                 │
│                           │                                         │
│                    ┌──────┴───────┐                                 │
│                    │ Eden Treaty  │                                 │
│                    │   (Client)   │                                 │
│                    └──────┬───────┘                                 │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ HTTP (type-safe)
┌───────────────────────────┼─────────────────────────────────────────┐
│                    ┌──────┴───────┐           Server (Elysia)       │
│                    │    Elysia    │                                 │
│                    │   (Bun.js)   │                                 │
│                    └──────┬───────┘                                 │
│         ┌─────────────────┼─────────────────────┐                   │
│         │                 │                     │                   │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────────┴─────────┐         │
│  │ Better-Auth  │  │ Game Routes  │  │  Auth Middleware  │         │
│  │   Handler    │  │ (games, etc) │  │  (session check)  │         │
│  └──────────────┘  └──────┬───────┘  └───────────────────┘         │
│                           │                                         │
│                    ┌──────┴───────┐                                 │
│                    │  Drizzle ORM │                                 │
│                    └──────┬───────┘                                 │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                     ┌──────┴───────┐
                     │    SQLite    │
                     │  (dev.db)    │
                     └──────────────┘
```

## Package Structure

```
packages/
├── client/          # React frontend application
├── server/          # Elysia backend API
└── shared/          # Shared TypeScript types
```

### Client Package

**Technology Stack:**
- React 19 with functional components
- TanStack Router (file-based routing)
- TanStack Query (server state management)
- Tailwind CSS v4 + Shadcn UI
- Eden Treaty (type-safe API client)

**Key Directories:**
```
src/
├── routes/          # File-based routes (auto-generated tree)
├── components/      # Reusable UI components
│   └── milito/      # Game-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utilities (api client, queries)
└── styles.css       # Global Tailwind styles
```

### Server Package

**Technology Stack:**
- Elysia (Bun runtime)
- Drizzle ORM
- Better-Auth (authentication)
- SQLite (development, swappable to PostgreSQL)

**Key Directories:**
```
src/
├── routes/          # API route handlers
├── db/              # Database schema and client
├── lib/             # Auth configuration
└── middleware/      # Elysia plugins (auth)
```

### Shared Package

Contains TypeScript types shared between client and server:
- User/auth types
- Game-specific types (e.g., Milito game state)

## Data Model

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    user     │       │   session   │       │   account   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ userId (FK) │       │ userId (FK) │
│ name        │       │ token       │       │ providerId  │
│ email       │       │ expiresAt   │       │ password    │
└─────────────┘       └─────────────┘       └─────────────┘
       │
       │
       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   games     │       │ gameRooms   │       │ gamePlayers │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ gameId (FK) │◄──────┤ roomId (FK) │
│ name        │       │ hostId (FK) │───────┤ userId (FK) │
│ minPlayers  │       │ status      │       │ position    │
│ maxPlayers  │       │ maxPlayers  │       │ score       │
└─────────────┘       └─────────────┘       └─────────────┘
                             │
                             │
                             ▼
                      ┌─────────────┐
                      │ gameState   │
                      ├─────────────┤
                      │ roomId (PK) │
                      │ state (JSON)│
                      │ currentTurn │
                      └─────────────┘
```

### Room Lifecycle

```
waiting → playing → finished
```

1. **waiting**: Room created, players can join
2. **playing**: Game initialized, turns in progress
3. **finished**: Game complete, winner determined

## API Design

### Authentication (Better-Auth)
- `POST /api/auth/sign-up/email` - Register
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Current session

### Game Management
- `GET /api/games` - List available games
- `GET /api/games/rooms` - List game rooms
- `POST /api/games/rooms` - Create room
- `POST /api/games/rooms/:roomId/join` - Join room
- `POST /api/games/rooms/:roomId/leave` - Leave room

### Memory Match Gameplay
- `GET /api/gameplay/:roomId/state` - Get game state
- `POST /api/gameplay/:roomId/initialize` - Start game
- `POST /api/gameplay/:roomId/flip` - Flip card
- `POST /api/gameplay/:roomId/reset` - Reset game

### Milito Gameplay
- `GET /api/milito/:roomId/state` - Get game state
- `POST /api/milito/:roomId/initialize` - Start game
- `POST /api/milito/:roomId/select-card` - Select card from hand
- `POST /api/milito/:roomId/select-column` - Choose column to place
- `POST /api/milito/:roomId/discard` - Discard card to complete turn

## Game Architecture

### Adding a New Game

1. **Define Types** (`packages/shared/src/types/`)
   - Game state interface
   - Player state interface
   - Action types

2. **Create Routes** (`packages/server/src/routes/`)
   - Initialize game state
   - Handle game actions
   - Validate turns and moves

3. **Build Components** (`packages/client/src/components/`)
   - Game board/display
   - Player controls
   - State visualization

4. **Add Query Hooks** (`packages/client/src/lib/queries.ts`)
   - Fetch game state
   - Mutation hooks for actions

### Game State Pattern

Games use a JSON state blob stored in `gameState.state`:

```typescript
interface GameState {
  players: Record<string, PlayerState>
  currentPlayerId: string
  turnNumber: number
  status: 'playing' | 'finished'
  winnerId?: string
}
```

This allows each game to define its own state structure while sharing the same database schema.

## Current Games

### Memory Match
- **Players**: 2-4
- **Mechanics**: Turn-based card matching
- **State**: 16 cards (8 pairs), flipped/matched status

### Milito
- **Players**: 2
- **Mechanics**: Ancient warfare card game
- **Factions**: Alexandrian Macedonian, Ancient British
- **Turn Phases**: Select Card → Select Column → Discard

## Type Safety

End-to-end type safety is achieved through:

1. **Eden Treaty**: Client automatically gets types from server
2. **Shared Package**: Common types imported by both packages
3. **Drizzle ORM**: Database schema generates TypeScript types

```
Server (Elysia) ──export type App──▶ Client (Eden Treaty)
                                            │
Shared Types ◀────────────────────────────┘
```

## Security

- **Authentication**: Better-Auth with session cookies
- **Authorization**: Auth middleware checks user context
- **Protected Routes**: Server validates user in room before actions
- **CORS**: Configured for specific client origin
- **Cookies**: HttpOnly, secure in production

## Future Considerations

- **Real-time Updates**: WebSocket support (Elysia has built-in support)
- **Additional Games**: Follow game architecture pattern
- **Database Scaling**: Switch to PostgreSQL for production
- **OAuth Providers**: Better-Auth supports multiple providers
