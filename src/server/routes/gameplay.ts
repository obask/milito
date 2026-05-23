import { ApiRouter, t } from '../api-router'
import { db } from '../db/index.js'
import { gameRooms, gamePlayers, gameState } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth.js'

export interface MemoryCard {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

export interface MemoryMatchState {
  cards: MemoryCard[]
  flippedIndices: number[]
  matchedPairs: number
  currentPlayerPosition: number
  scores: { [position: number]: number }
}

function createMemoryMatchDeck(pairs: number = 8): MemoryCard[] {
  const symbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎸', '🎹', '🎤', '🎧', '🎼']
  const selectedSymbols = symbols.slice(0, pairs)
  const cards: MemoryCard[] = []

  selectedSymbols.forEach((symbol, idx) => {
    cards.push(
      {
        id: idx * 2,
        value: symbol,
        isFlipped: false,
        isMatched: false,
      },
      {
        id: idx * 2 + 1,
        value: symbol,
        isFlipped: false,
        isMatched: false,
      },
    )
  })

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }

  return cards
}

export const gameplayRoutes = new ApiRouter({ prefix: '/api/gameplay' })
  .use(authMiddleware)
  .get(
    '/:roomId/state',
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const player = await db
        .select()
        .from(gamePlayers)
        .where(and(eq(gamePlayers.roomId, params.roomId), eq(gamePlayers.userId, user.id)))
        .limit(1)

      if (!player[0]) {
        set.status = 403
        return { error: 'Forbidden', message: 'You are not in this room' }
      }

      const state = await db
        .select()
        .from(gameState)
        .where(eq(gameState.roomId, params.roomId))
        .limit(1)

      if (!state[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Game not started yet' }
      }

      const room = await db
        .select()
        .from(gameRooms)
        .where(eq(gameRooms.id, params.roomId))
        .limit(1)

      const players = await db
        .select()
        .from(gamePlayers)
        .where(eq(gamePlayers.roomId, params.roomId))
        .orderBy(gamePlayers.position)

      return {
        room: room[0],
        state: state[0].state as MemoryMatchState,
        players,
        currentPlayerPosition: player[0].position,
      }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    '/:roomId/initialize',
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const room = await db
        .select()
        .from(gameRooms)
        .where(eq(gameRooms.id, params.roomId))
        .limit(1)

      if (!room[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Room not found' }
      }

      if (room[0].hostId !== user.id) {
        set.status = 403
        return { error: 'Forbidden', message: 'Only host can initialize the game' }
      }

      const players = await db.select().from(gamePlayers).where(eq(gamePlayers.roomId, params.roomId))

      const scores: { [position: number]: number } = {}
      players.forEach((player) => {
        scores[player.position] = 0
      })

      const initialState: MemoryMatchState = {
        cards: createMemoryMatchDeck(8),
        flippedIndices: [],
        matchedPairs: 0,
        currentPlayerPosition: 0,
        scores,
      }

      await db
        .insert(gameState)
        .values({
          roomId: params.roomId,
          state: initialState,
          currentTurn: 0,
        })
        .onConflictDoUpdate({
          target: gameState.roomId,
          set: {
            state: initialState,
            currentTurn: 0,
            updatedAt: new Date(),
          },
        })

      return { success: true }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    '/:roomId/flip',
    async ({ params, body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const player = await db
        .select()
        .from(gamePlayers)
        .where(and(eq(gamePlayers.roomId, params.roomId), eq(gamePlayers.userId, user.id)))
        .limit(1)

      if (!player[0]) {
        set.status = 403
        return { error: 'Forbidden', message: 'You are not in this room' }
      }

      const stateRow = await db
        .select()
        .from(gameState)
        .where(eq(gameState.roomId, params.roomId))
        .limit(1)

      if (!stateRow[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Game not started' }
      }

      const state = stateRow[0].state as MemoryMatchState

      if (state.currentPlayerPosition !== player[0].position) {
        set.status = 400
        return { error: 'Bad request', message: 'Not your turn' }
      }

      if (state.flippedIndices.length >= 2) {
        set.status = 400
        return { error: 'Bad request', message: 'Please reset flipped cards first' }
      }

      const cardIndex = state.cards.findIndex((c) => c.id === body.cardId)
      if (cardIndex === -1) {
        set.status = 404
        return { error: 'Not found', message: 'Card not found' }
      }

      const card = state.cards[cardIndex]
      if (card.isMatched || card.isFlipped) {
        set.status = 400
        return { error: 'Bad request', message: 'Card already flipped or matched' }
      }

      state.cards[cardIndex].isFlipped = true
      state.flippedIndices.push(cardIndex)

      if (state.flippedIndices.length === 2) {
        const [idx1, idx2] = state.flippedIndices
        const card1 = state.cards[idx1]
        const card2 = state.cards[idx2]

        if (card1.value === card2.value) {
          state.cards[idx1].isMatched = true
          state.cards[idx2].isMatched = true
          state.matchedPairs++
          state.scores[player[0].position]++

          await db
            .update(gamePlayers)
            .set({
              score: state.scores[player[0].position],
            })
            .where(eq(gamePlayers.id, player[0].id))

          if (state.matchedPairs === state.cards.length / 2) {
            await db
              .update(gameRooms)
              .set({
                status: 'finished',
                finishedAt: new Date(),
              })
              .where(eq(gameRooms.id, params.roomId))
          }
        }
      }

      await db
        .update(gameState)
        .set({
          state,
          updatedAt: new Date(),
        })
        .where(eq(gameState.roomId, params.roomId))

      return { success: true, state }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
      body: t.Object({
        cardId: t.Number(),
      }),
    },
  )
  .post(
    '/:roomId/reset',
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const player = await db
        .select()
        .from(gamePlayers)
        .where(and(eq(gamePlayers.roomId, params.roomId), eq(gamePlayers.userId, user.id)))
        .limit(1)

      if (!player[0]) {
        set.status = 403
        return { error: 'Forbidden', message: 'You are not in this room' }
      }

      const stateRow = await db
        .select()
        .from(gameState)
        .where(eq(gameState.roomId, params.roomId))
        .limit(1)

      if (!stateRow[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Game not started' }
      }

      const state = stateRow[0].state as MemoryMatchState

      if (state.currentPlayerPosition !== player[0].position) {
        set.status = 400
        return { error: 'Bad request', message: 'Not your turn' }
      }

      if (state.flippedIndices.length === 2) {
        const [idx1, idx2] = state.flippedIndices
        const card1 = state.cards[idx1]
        const card2 = state.cards[idx2]

        if (card1.value !== card2.value) {
          state.cards[idx1].isFlipped = false
          state.cards[idx2].isFlipped = false

          const players = await db
            .select()
            .from(gamePlayers)
            .where(eq(gamePlayers.roomId, params.roomId))

          state.currentPlayerPosition = (state.currentPlayerPosition + 1) % players.length
        }
      }

      state.flippedIndices = []

      await db
        .update(gameState)
        .set({
          state,
          updatedAt: new Date(),
        })
        .where(eq(gameState.roomId, params.roomId))

      return { success: true, state }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
