# CLAUDE.md

Instructions for Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Bestagon Arena** - A multiplayer board game platform with real-time game rooms, lobbies, and turn-based gameplay. Currently implements Memory Match and Milito (ancient warfare card game).

## Project Architecture

This is a **monorepo** with a Solid.js frontend and Python FastAPI backend.

**Structure:**
```
packages/
├── client/         - Solid.js frontend (Vite + Solid Router)
├── server-python/  - FastAPI backend (SQLAlchemy ORM)
├── shared/         - Shared TypeScript types
├── games/          - Game definitions
└── platform/       - Platform utilities
```

**Tech Stack:**
- **Frontend**: Solid.js, Vite, Solid Router, TanStack Solid Query, Tailwind CSS v4
- **Backend**: FastAPI (Python), SQLAlchemy, Uvicorn
- **Database**: SQLite via SQLAlchemy (easily swappable to PostgreSQL/MySQL)
- **Monorepo**: pnpm workspaces (for JS) + Python venv

## Common Commands

### Development
```bash
pnpm dev              # Run both client (5173) and server (3001)
pnpm dev:server       # Run FastAPI server only
pnpm dev:client       # Run client only
pnpm build            # Build client
```

### Python Setup
```bash
pnpm python:setup     # Create venv, install deps, create tables
```

### Manual Python Commands
```bash
cd packages/server-python
./venv/bin/uvicorn app.main:app --reload --port 3001
./venv/bin/python create_tables.py
```

## Key File Locations

### Server (`packages/server-python/`)
- **Entry**: `app/main.py` - FastAPI application entry point
- **Config**: `app/config.py` - Configuration settings
- **Database**: `app/database.py` - SQLAlchemy setup
- **Models**: `app/models/` - SQLAlchemy ORM models
- **Routers**: `app/routers/` - API route handlers
  - `auth.py` - Authentication endpoints
  - `games.py` - Game listing, room management
  - `gameplay.py` - Memory Match game state and actions
  - `milito.py` - Milito card game state and actions
- **Schemas**: `app/schemas/` - Pydantic request/response schemas
- **Services**: `app/services/` - Business logic
- **Requirements**: `requirements.txt` - Python dependencies

### Client (`packages/client/`)
- **Entry**: `src/main.tsx` - Solid.js app entry point
- **Routes**: `src/routes/`
  - `index.tsx` - Home page
  - `games.tsx` - Game gallery (browse available games)
  - `lobby.tsx` - Room listing and creation
  - `room.[roomId].tsx` - Active game room with gameplay UI
  - `login.tsx`, `register.tsx` - Auth pages
  - `dashboard.tsx` - User profile (protected)
- **Components**: `src/components/` - Reusable Solid.js components
  - `milito/` - Milito game components (MilitoBoard, MilitoCard, MilitoGame, MilitoHand)
- **API Client**: `src/lib/api.ts` - Fetch-based API client
- **Query Hooks**: `src/lib/queries.ts` - TanStack Solid Query hooks
- **Styles**: `src/styles.css` - Global Tailwind styles
- **Assets**: `public/` - Static files (favicon, images)
  - `assets/milito/` - Milito game images (faction units, leaders, backgrounds)
- **Config**: `vite.config.ts` - Vite configuration with proxy

### Shared (`packages/shared/`)
- **Types**: `src/types/` - Shared TypeScript types
  - `milito.ts` - Milito game types (cards, factions, game state)

## Development Patterns

### Adding a FastAPI Endpoint

1. **Define route** in `packages/server-python/app/routers/`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/my", tags=["my"])

@router.get("/")
async def list_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

@router.post("/")
async def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    item = Item(**data.dict(), user_id=user.id)
    db.add(item)
    db.commit()
    return item
```

2. **Mount in main app** (`packages/server-python/app/main.py`):
```python
from app.routers import my
app.include_router(my.router)
```

3. **Add to API client** in `packages/client/src/lib/api.ts`:
```typescript
export const api = {
  // ...existing...
  my: {
    list: () => request<Item[]>('/my'),
    create: (data: ItemCreate) => request<Item>('/my', { method: 'POST', body: data }),
  },
}
```

4. **Add query hook** in `packages/client/src/lib/queries.ts`:
```typescript
export function createMyItems() {
  return createQuery(() => ({
    queryKey: ['myItems'],
    queryFn: () => api.my.list(),
  }))
}

export function createCreateMyItem() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: ItemCreate) => api.my.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] })
    },
  }))
}
```

### Adding a Route/Page (Solid Router)

Create file in `packages/client/src/routes/`:
```typescript
import { A } from '@solidjs/router'

export default function MyPage() {
  return <div>My Page</div>
}
```

Register in router configuration if needed.

### Protected Routes

Use route guards or check auth in component:
```typescript
import { createMe } from '@/lib/queries'
import { useNavigate } from '@solidjs/router'
import { createEffect } from 'solid-js'

export default function ProtectedPage() {
  const me = createMe()
  const navigate = useNavigate()

  createEffect(() => {
    if (!me.isLoading && !me.data) {
      navigate('/login')
    }
  })

  return <Show when={me.data}>{(user) => <div>Welcome {user().name}</div>}</Show>
}
```

### Database Schema Changes

1. Edit models in `packages/server-python/app/models/`
2. Run `./venv/bin/python create_tables.py` to recreate tables

## Code Style Guidelines

### TypeScript / Solid.js
- Use explicit types for function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `const` for immutable values, avoid `var`
- Use Solid.js signals and stores for reactivity
- Prefer `Show`, `For`, `Switch/Match` for conditional rendering

### Python / FastAPI
- Use type hints for all function parameters and returns
- Use Pydantic models for request/response validation
- Use dependency injection for database sessions and auth
- Follow PEP 8 style guidelines

### File Naming
- Components: PascalCase (`MyComponent.tsx`)
- Routes: kebab-case (`my-route.tsx`)
- Python modules: snake_case (`my_module.py`)
- Utilities: camelCase (`myUtil.ts`)

## Authentication

Authentication uses JWT tokens with HTTP-only cookies:
- **Login**: `POST /api/auth/sign-in/email`
- **Register**: `POST /api/auth/sign-up/email`
- **Logout**: `POST /api/auth/sign-out`
- **Session**: `GET /api/auth/get-session`

## Environment Variables

### Server Environment Variables
Create `packages/server-python/.env`:
```env
DATABASE_URL=sqlite:///./dev.db
SECRET_KEY=your-secret-key-minimum-32-chars
```

### Client Environment Variables (Optional)
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
- Shared types live in `packages/shared/src/types/`
- API client uses TypeScript interfaces matching Python Pydantic schemas
- Import shared types: `import type { MilitoCard } from '@app/shared/types/milito'`

## Troubleshooting

### Common Issues

**Python venv issues**
- Recreate venv: `rm -rf packages/server-python/venv && pnpm python:setup`

**Database errors**
- Delete `dev.db` and run `./venv/bin/python create_tables.py`

**CORS/Cookie issues**
- Verify Vite proxy in `packages/client/vite.config.ts`
- Check that fetch calls use `credentials: 'include'`

## Deployment

### Server Deployment (FastAPI)
- Install Python 3.11+
- `pip install -r requirements.txt`
- Run: `uvicorn app.main:app --host 0.0.0.0 --port 3001`
- Platforms: Fly.io, Railway, Render, AWS, etc.

### Client Deployment
- Build: `pnpm build:client`
- Output: `packages/client/dist/`
- Platforms: Vercel, Netlify, Cloudflare Pages, etc.

## Game Arena Database Tables

- `games` - Available games (name, description, min/max players, image)
- `game_rooms` - Game instances with status: `waiting` → `playing` → `finished`
- `game_players` - Players in rooms with position (turn order) and score
- `game_state` - JSON blob for game-specific state (cards, deck, turn counter)

## Current Games

**Memory Match** (`packages/server-python/app/routers/gameplay.py`):
- 16 cards (8 emoji pairs), 4x4 grid
- Turn-based: flip 2 cards, match = keep + score, no match = flip back
- Endpoints: `GET /api/gameplay/:roomId/state`, `POST /api/gameplay/:roomId/initialize`, `POST /api/gameplay/:roomId/flip`, `POST /api/gameplay/:roomId/reset`

**Milito** (`packages/server-python/app/routers/milito.py`):
- Ancient warfare card game with army factions (Alexandrian Macedonian, Ancient British)
- Components: `MilitoBoard`, `MilitoCard`, `MilitoGame`, `MilitoHand` in `packages/client/src/components/milito/`
- Types: `packages/shared/src/types/milito.ts`
- Assets: `packages/client/public/assets/milito/` (faction images, leaders, units)
