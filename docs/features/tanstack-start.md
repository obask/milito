# TanStack Start Runtime

## What

The app is now a single TanStack Start React application. UI routes, Better Auth endpoints, and game API endpoints are served from the same runtime without a separate Elysia server.

## Where

- `src/routes/__root.tsx` defines the app shell and React Query provider.
- `src/routes/api.auth.$.ts` forwards Better Auth requests.
- `src/routes/api.$.ts` forwards game API requests to `src/server/api.ts`.
- `src/server/routes/` contains the game endpoint handlers.
- `src/server/db/schema.ts` contains the current SQLite schema.
