# CLAUDE.md

Instructions for Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Bestagon Arena** - A multiplayer board game platform with real-time game rooms, lobbies, and turn-based gameplay. Currently implements Memory Match and Milito (ancient warfare card game).

## Project Architecture

This is a **TypeScript monorepo** with separate client and server applications, connected via Eden Treaty for end-to-end type safety.

**Structure:**
```
packages/
├── client/   - React frontend (Vite + TanStack Router)
├── server/   - Elysia backend (Eden Treaty + Drizzle ORM)
└── shared/   - Shared TypeScript types
```

**Tech Stack:**
- **Frontend**: React, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, Shadcn UI
- **Backend**: Elysia (Bun runtime), Eden Treaty, Drizzle ORM, Better-Auth
- **Database**: SQLite via Bun's native driver (easily swappable to PostgreSQL/MySQL)
- **Monorepo**: pnpm workspaces

## Common Commands

### Development
```bash
pnpm dev              # Run both client (5173) and server (3001)
pnpm dev:server       # Run server only
pnpm dev:client       # Run client only
pnpm build            # Build all packages
```

### Database (Drizzle ORM)
```bash
pnpm --filter @app/server db:generate    # Generate migrations
pnpm --filter @app/server db:push        # Apply schema to database
pnpm --filter @app/server db:studio      # Open Drizzle Studio GUI
```

### Adding Components
```bash
pnpm --filter @app/client dlx shadcn@latest add <component>
```

## Key File Locations

### Server (`packages/server/`)
- **Entry**: `src/index.ts` - Elysia server setup, exports `App` type for Eden Treaty
- **Database**: `src/db/schema.ts` - Drizzle schema (users, games, rooms, players, state)
- **Database client**: `src/db/index.ts` - Exports `db` instance
- **Database seeding**: `src/db/seed.ts` - Populates sample games
- **Auth**: `src/lib/auth.ts` - Better-Auth configuration
- **Auth Middleware**: `src/middleware/auth.ts` - Elysia plugin for user/session extraction
- **Routes**: `src/routes/`
  - `auth.ts` - Authentication endpoints (POST /api/auth/register, login, logout, GET /api/auth/me)
  - `games.ts` - Game listing, room management (GET/POST /api/games, /api/games/rooms)
  - `gameplay.ts` - Memory Match game state and actions
  - `milito.ts` - Milito card game state and actions
- **Migrations**: `drizzle/` - Database migration files
- **Config**: `drizzle.config.ts` - Drizzle ORM configuration

### Client (`packages/client/`)
- **Entry**: `src/main.tsx` - React app entry point
- **Routes**: `src/routes/`
  - `index.tsx` - Home page
  - `games.tsx` - Game gallery (browse available games)
  - `lobby.tsx` - Room listing and creation
  - `room.$roomId.tsx` - Active game room with gameplay UI
  - `login.tsx`, `register.tsx` - Auth pages
  - `dashboard.tsx` - User profile (protected)
- **Components**: `src/components/` - Reusable React components
  - `milito/` - Milito game components (MilitoBoard, MilitoCard, MilitoGame, MilitoHand)
- **Hooks**: `src/hooks/` - Custom React hooks (e.g., `useAuth.ts`)
- **API Client**: `src/lib/api.ts` - Eden Treaty client setup
- **Query Hooks**: `src/lib/queries.ts` - Custom hooks wrapping Eden Treaty with TanStack Query
- **Styles**: `src/styles.css` - Global Tailwind styles
- **Assets**: `public/` - Static files (favicon, images)
  - `assets/milito/` - Milito game images (faction units, leaders, backgrounds)
- **Config**: `vite.config.ts` - Vite configuration with proxy

### Shared (`packages/shared/`)
- **Types**: `src/types/` - Shared TypeScript types between client/server
  - `milito.ts` - Milito game types (cards, factions, game state)

## Development Patterns

### Adding an Elysia Endpoint

1. **Define route** in `packages/server/src/routes/`:
```typescript
import { Elysia, t } from 'elysia'
import { authMiddleware } from '../middleware/auth.js'

export const myRoutes = new Elysia({ prefix: '/api/my' })
  .use(authMiddleware)
  // Public endpoint
  .get('/', async () => {
    return await db.select().from(items)
  })
  // Protected endpoint with validation
  .post(
    '/',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
      return await db.insert(items).values(body)
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )
```

2. **Mount in main app** (`packages/server/src/index.ts`):
```typescript
import { myRoutes } from './routes/my.js'
const app = new Elysia()
  .use(myRoutes)
  // ...
export type App = typeof app  // Critical for Eden Treaty
```

3. **Add query hook** in `packages/client/src/lib/queries.ts`:
```typescript
export function useMyItems() {
  return useQuery({
    queryKey: ['myItems'],
    queryFn: async () => {
      const { data, error } = await api.api.my.get()
      if (error) throw error
      return data
    },
  })
}

export function useCreateMyItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data, error } = await api.api.my.post(input)
      if (error) throw new Error('Failed')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] })
    },
  })
}
```

4. **Use in component**:
```typescript
const { data: items } = useMyItems()
const mutation = useCreateMyItem()
```

### Adding a Route/Page

Create file in `packages/client/src/routes/`:
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-page')({
  component: MyPage,
})

function MyPage() {
  return <div>My Page</div>
}
```

Route automatically available at `/my-page`.

### Protected Routes

Use `beforeLoad` with auth check:
```typescript
import { apiClient } from '@/lib/queries'

export const Route = createFileRoute('/protected')({
  component: ProtectedPage,
  beforeLoad: async () => {
    const user = await apiClient.auth.me()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
})
```

### Database Schema Changes

1. Edit `packages/server/src/db/schema.ts`
2. Generate migration: `pnpm --filter @app/server db:generate`
3. Apply to DB: `pnpm --filter @app/server db:push`

### Adding a New Game

1. **Add game to seed** (`packages/server/src/db/seed.ts`):
```typescript
{ name: 'My Game', description: '...', minPlayers: 2, maxPlayers: 4 }
```

2. **Define game state types** in gameplay route or shared types

3. **Add game endpoints** (`packages/server/src/routes/gameplay.ts`):
```typescript
.post(
  '/:roomId/myGameAction',
  async ({ params, body, user, set }) => {
    // Handle game action, update state
  },
  {
    params: t.Object({ roomId: t.String() }),
    body: t.Object({ /* action params */ }),
  },
)
```

4. **Create query hook** in `packages/client/src/lib/queries.ts`

5. **Create game UI** in the room component or a game-specific component

## Code Style Guidelines

### TypeScript
- Use explicit types for function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `const` for immutable values, avoid `var`

### React
- Functional components only (no class components)
- Use hooks (useState, useEffect, etc.) following Rules of Hooks
- All hooks must be called at top of component before any conditional returns
- Prefer custom hooks for reusable logic

### Elysia
- Use `authMiddleware` for routes that need user context
- Check `user` in handlers for protected operations
- Use `t.Object()` for body/params validation
- Return error objects with `set.status` for error responses

### File Naming
- Components: PascalCase (`MyComponent.tsx`)
- Routes: kebab-case (`my-route.tsx`)
- Utilities: camelCase (`myUtil.ts`)
- Types: PascalCase (`MyType.ts` or in `types/` directory)

## Authentication

This template uses **Better-Auth** for authentication with the recommended Elysia integration pattern:
- Server config: `packages/server/src/lib/auth.ts`
- Auth middleware: `packages/server/src/middleware/auth.ts` (macro pattern for protected routes)
- Client hook: `packages/client/src/hooks/useAuth.ts`

**Integration Pattern (Best Practice):**
Better-Auth handler is mounted directly using `.mount('/api/auth', auth.handler)` in the main app, exposing all auth endpoints automatically.

**API Endpoints (provided by Better-Auth):**
- `POST /api/auth/sign-up/email` - Sign up with email/password
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Get current session

**Session handling:**
- Sessions stored in database
- Cookies set automatically by Better-Auth
- Session validated in Elysia middleware via `authMiddleware`

## Environment Variables

### Required Server Environment Variables
Create `packages/server/.env`:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=./dev.db
CLIENT_URL=http://localhost:5173
COOKIE_SECRET=your-secret-key-minimum-32-chars
```

### Optional Client Environment Variables
Create `packages/client/.env`:
```env
VITE_API_URL=http://localhost:3001
```

## Important Notes

### CORS & Cookies
- Client uses Vite proxy (`/api` → `http://localhost:3001/api`)
- This ensures same-origin cookies work in Safari/strict browsers
- Configured in `packages/client/vite.config.ts`

### Type Safety
- Server types automatically flow to client via Eden Treaty
- Export `type App = typeof app` from server index for Eden to work
- Shared types live in `packages/shared/src/types/`
- Import shared types: `import type { User } from '@app/shared/types/user'`

### Database Migrations
- Always generate migrations before pushing schema changes
- Migrations stored in `packages/server/drizzle/`
- Use `db:push` for development, `db:migrate` for production

### React Router
- Routes auto-generate from files in `src/routes/`
- Generated route tree: `src/routeTree.gen.ts` (don't edit manually)
- Use `Link` component for navigation (not `<a>` tags)

## Troubleshooting

### Common Issues

**"Cannot find module '@app/server'"**
- Run `pnpm install` in root directory
- Rebuild server: `pnpm --filter @app/server build`

**Database errors**
- Check `DATABASE_URL` in server `.env`
- Regenerate migrations: `pnpm --filter @app/server db:generate`
- Clear and recreate: Delete `dev.db`, run `db:push`

**CORS/Cookie issues**
- Verify Vite proxy in `packages/client/vite.config.ts`
- Check `CLIENT_URL` in server `.env` matches exactly
- Ensure Eden client uses `credentials: 'include'`

**React Hooks errors**
- All hooks must be called before any conditional returns
- Move `useMutation`, `useQuery` to top of component
- Don't call hooks inside loops, conditions, or nested functions

## Deployment

### Server Deployment
- Build: `pnpm --filter @app/server build`
- Output: `packages/server/dist/`
- Start: `node packages/server/dist/index.js`
- Platforms: Fly.io, Railway, Render, AWS, etc.

### Client Deployment
- Build: `pnpm --filter @app/client build`
- Output: `packages/client/dist/`
- Platforms: Vercel, Netlify, Cloudflare Pages, etc.

### Environment Variables in Production
- Set all required env vars on hosting platform
- Use production database URL (not SQLite)
- Set `COOKIE_SECRET` to secure random string
- Update `CLIENT_URL` to production domain
- Enable `secure: true` for cookies in production

## Game Arena Database Tables

- `games` - Available games (name, description, min/max players, image)
- `gameRooms` - Game instances with status: `waiting` → `playing` → `finished`
- `gamePlayers` - Players in rooms with position (turn order) and score
- `gameState` - JSON blob for game-specific state (cards, deck, turn counter)

## Current Games

**Memory Match** (`packages/server/src/routes/gameplay.ts`):
- 16 cards (8 emoji pairs), 4x4 grid
- Turn-based: flip 2 cards, match = keep + score, no match = flip back
- Endpoints: `GET /api/gameplay/:roomId/state`, `POST /api/gameplay/:roomId/initialize`, `POST /api/gameplay/:roomId/flip`, `POST /api/gameplay/:roomId/reset`

**Milito** (`packages/server/src/routes/milito.ts`):
- Ancient warfare card game with army factions (Alexandrian Macedonian, Ancient British)
- Components: `MilitoBoard`, `MilitoCard`, `MilitoGame`, `MilitoHand` in `packages/client/src/components/milito/`
- Types: `packages/shared/src/types/milito.ts`
- Assets: `packages/client/public/assets/milito/` (faction images, leaders, units)

## Further Customization

- **Add new games**: Follow "Adding a New Game" pattern above
- **Change database**: Update Drizzle config and schema (see Drizzle docs)
- **Add OAuth**: Configure Better-Auth with OAuth providers
- **Real-time updates**: Consider adding WebSocket support for live game state (Elysia has built-in WebSocket support)
