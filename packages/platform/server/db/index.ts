import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema.js'
import { env } from '../env.js'

const sqlite = new Database(env.DATABASE_URL)

export const db = drizzle(sqlite, {
  schema,
  logger: env.NODE_ENV === 'development',
})
