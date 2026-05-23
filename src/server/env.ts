import { config } from 'dotenv'
import { z } from 'zod'

config({ path: '.env.local' })
config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1).default('./dev.db'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  COOKIE_SECRET: z.string().min(32).optional(),
})

export const env = envSchema.parse(process.env)
export const authSecret = env.BETTER_AUTH_SECRET || env.COOKIE_SECRET || 'development-secret-key-minimum-32-chars'
