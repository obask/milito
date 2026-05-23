import { db } from './index.js'
import { games, user } from './schema.js'
import { auth } from '../lib/auth.js'
import { eq } from 'drizzle-orm'

const sampleGames = [
  {
    id: 'milito',
    name: 'Milito',
    description: 'Ancient tactical card game. Deploy units on a 5-column battlefield to conquer territory!',
    minPlayers: 2,
    maxPlayers: 2,
    imageUrl: '⚔️',
  },
]

async function seed() {
  console.log('🌱 Seeding database...')

  // Seed games
  const existingGames = await db.select().from(games)
  if (existingGames.length > 0) {
    console.log('✅ Games already seeded')
  } else {
    await db.insert(games).values(sampleGames)
    console.log('✅ Seeded', sampleGames.length, 'games')
  }

  // Seed test user
  const existingUser = await db.select().from(user).where(eq(user.email, 'test@example.com'))
  if (existingUser.length === 0) {
    await auth.api.signUpEmail({
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    })
    console.log('✅ Seeded test user (test@example.com / password123)')
  } else {
    console.log('✅ Test user already exists')
  }
}

seed()
  .then(() => {
    console.log('✅ Seed complete')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
