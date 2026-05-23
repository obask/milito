# Milito

TanStack Start implementation of Milito. The previous Elysia monorepo implementation was replaced on this branch with a single React app that serves UI routes and API routes from TanStack Start.

## Commands

```sh
pnpm install
pnpm dev
pnpm build
```

## Database

The app uses Drizzle with SQLite. Set `DATABASE_URL` in `.env.local`, or it defaults to `./dev.db`.

```sh
pnpm db:push
pnpm db:seed
```
