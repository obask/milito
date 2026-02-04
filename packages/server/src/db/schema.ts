import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// Better-Auth tables
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

// Board Game Arena tables
export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  minPlayers: integer('min_players').notNull(),
  maxPlayers: integer('max_players').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})

export const gameRooms = sqliteTable(
  'game_rooms',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    hostId: text('host_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['waiting', 'playing', 'finished'] })
      .notNull()
      .default('waiting'),
    maxPlayers: integer('max_players').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('game_rooms_gameId_idx').on(table.gameId),
    index('game_rooms_hostId_idx').on(table.hostId),
    index('game_rooms_status_idx').on(table.status),
  ],
)

export const gamePlayers = sqliteTable(
  'game_players',
  {
    id: text('id').primaryKey(),
    roomId: text('room_id')
      .notNull()
      .references(() => gameRooms.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    score: integer('score').default(0).notNull(),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('game_players_roomId_idx').on(table.roomId),
    index('game_players_userId_idx').on(table.userId),
  ],
)

export const gameState = sqliteTable('game_state', {
  roomId: text('room_id')
    .primaryKey()
    .references(() => gameRooms.id, { onDelete: 'cascade' }),
  state: text('state', { mode: 'json' }).notNull(),
  currentTurn: integer('current_turn').default(0).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
})

// Game relations
export const gamesRelations = relations(games, ({ many }) => ({
  rooms: many(gameRooms),
}))

export const gameRoomsRelations = relations(gameRooms, ({ one, many }) => ({
  game: one(games, {
    fields: [gameRooms.gameId],
    references: [games.id],
  }),
  host: one(user, {
    fields: [gameRooms.hostId],
    references: [user.id],
  }),
  players: many(gamePlayers),
  state: one(gameState, {
    fields: [gameRooms.id],
    references: [gameState.roomId],
  }),
}))

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  room: one(gameRooms, {
    fields: [gamePlayers.roomId],
    references: [gameRooms.id],
  }),
  user: one(user, {
    fields: [gamePlayers.userId],
    references: [user.id],
  }),
}))

export const gameStateRelations = relations(gameState, ({ one }) => ({
  room: one(gameRooms, {
    fields: [gameState.roomId],
    references: [gameRooms.id],
  }),
}))
