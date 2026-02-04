import { z } from 'zod'
import { config } from 'dotenv'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_SECRET: z.string().min(32),
})

export const env = envSchema.parse(process.env)
