# Bestagon Arena

A multiplayer board game arena built with TypeScript, featuring real-time game rooms, lobbies, and turn-based gameplay.

## Features

- **Game Gallery** - Browse available games with descriptions and player limits
- **Lobby System** - Create and join game rooms with other players
- **Real-time Gameplay** - Turn-based multiplayer with live state synchronization
- **Memory Match** - Fully implemented card matching game for 1-4 players
- **Authentication** - Email/password auth with Better-Auth

## Stack

**Frontend:**
- [React](https://react.dev/) - UI library
- [Vite](https://vite.dev/) - Fast build tool
- [TanStack Router](https://tanstack.com/router) - Type-safe routing
- [TanStack Query](https://tanstack.com/query) - Data fetching & caching
- [tRPC Client](https://trpc.io/) - End-to-end type-safe API calls
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first styling
- [Shadcn UI](https://ui.shadcn.com/) - Re-usable component library

**Backend:**
- [Fastify](https://fastify.dev/) - High-performance web framework
- [tRPC](https://trpc.io/) - Type-safe API layer
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Better-Auth](https://better-auth.com/) - Modern authentication library
- [SQLite](https://www.sqlite.org/) - Embedded database (easily swappable)

**Monorepo:**
- [pnpm workspaces](https://pnpm.io/workspaces) - Fast, efficient package manager
- Shared TypeScript types between client/server

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v20+ recommended)
- [pnpm](https://pnpm.io/) v8+

### Installation

```bash
pnpm install
```

### Development

Run both client and server concurrently:

```bash
pnpm dev
```

This starts:
- **Server**: http://localhost:3001 (Fastify + tRPC)
- **Client**: http://localhost:5173 (Vite dev server)

Run services individually:

```bash
pnpm dev:server   # Server only
pnpm dev:client   # Client only
```

### Building for Production

```bash
pnpm build
```

## Project Structure

```
packages/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── routes/      # TanStack Router routes
│       │   ├── index.tsx        # Home page
│       │   ├── games.tsx        # Game gallery
│       │   ├── lobby.tsx        # Game room lobby
│       │   ├── room.$roomId.tsx # Active game room
│       │   ├── login.tsx        # Auth pages
│       │   ├── register.tsx
│       │   └── dashboard.tsx    # User dashboard
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks (useAuth)
│       └── lib/         # tRPC client, utils
├── server/              # Fastify backend
│   └── src/
│       ├── db/
│       │   ├── schema.ts   # Drizzle schema (users, games, rooms)
│       │   └── seed.ts     # Sample game data
│       ├── lib/
│       │   └── auth.ts     # Better-Auth config
│       └── trpc/routers/
│           ├── auth.ts     # Auth endpoints
│           ├── games.ts    # Game & room management
│           └── gameplay.ts # Game state & actions
└── shared/              # Shared TypeScript types
```

## Database Schema

### Authentication (Better-Auth)
- `user` - User accounts
- `session` - Session management
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

### Game Arena
- `games` - Available games (Memory Match, etc.)
- `gameRooms` - Game instances with status (waiting/playing/finished)
- `gamePlayers` - Players in each room with positions and scores
- `gameState` - JSON game state storage

## API Endpoints

### Auth (`trpc.auth.*`)
- `register` - Create account
- `login` - Sign in
- `me` - Get current user
- `logout` - Sign out

### Games (`trpc.games.*`)
- `list` - Get all available games
- `get` - Get game by ID
- `listRooms` - List game rooms (filterable by game/status)
- `createRoom` - Create new room (auth required)
- `joinRoom` - Join existing room
- `leaveRoom` - Leave room
- `startGame` - Start game (host only)

### Gameplay (`trpc.gameplay.*`)
- `getState` - Get current game state
- `initializeGame` - Set up game deck (Memory Match)
- `flipCard` - Flip a card
- `resetFlipped` - Reset unmatched cards

## Game: Memory Match

A card matching game for 1-4 players:

- 16 cards (8 matching pairs) with emoji symbols
- Turn-based multiplayer
- Flip two cards per turn
- Match = keep pair + score point + continue
- No match = cards flip back + next player's turn
- Winner = player with most matches

## Environment Variables

### Server (`packages/server/.env`)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=./dev.db
CLIENT_URL=http://localhost:5173
BETTER_AUTH_SECRET=your-secret-key-minimum-32-chars
```

### Client (`packages/client/.env`)

```env
VITE_API_URL=http://localhost:3001
```

## Database Management

```bash
# Generate migration from schema changes
pnpm --filter @app/server db:generate

# Apply migrations
pnpm --filter @app/server db:push

# Open Drizzle Studio (database GUI)
pnpm --filter @app/server db:studio
```

## Adding Games

1. Add game entry to `packages/server/src/db/seed.ts`
2. Create game-specific state types in schema
3. Add gameplay procedures in `packages/server/src/trpc/routers/gameplay.ts`
4. Create UI components in client

## Deployment

### Server
- Build: `pnpm --filter @app/server build`
- Start: `node packages/server/dist/index.js`
- Platforms: Fly.io, Railway, Render, AWS

### Client
- Build: `pnpm --filter @app/client build`
- Output: `packages/client/dist/`
- Platforms: Vercel, Netlify, Cloudflare Pages

## License

MIT
