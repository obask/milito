import { ApiRouter, t } from '../api-router'
import { db } from '../db/index.js'
import { gameRooms, gamePlayers, gameState, games } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth.js'
import type {
  MilitoGameState,
  MilitoPlayerState,
  MilitoPlayerTable,
  MilitoFaction,
} from '#/shared'

const MILITO_SELECT_CARD = 'SELECT_CARD'
const MILITO_SELECT_COLUMN = 'SELECT_COLUMN'
const MILITO_DISCARD = 'DISCARD'

function createInitialTable(): MilitoPlayerTable {
  return {
    enemy_row_2: [null, null, null, null, null],
    enemy_row_1: [null, null, null, null, null],
    territory_row: [0, 0, 0, 0, 0],
    player_row_1: [null, null, null, null, null],
    player_row_2: [null, null, null, null, null],
  }
}

function createInitialHand(): number[] {
  // Draw 5 random cards (0-4 are unit type indices)
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 5))
}

function createPlayerState(playerId: string, faction: MilitoFaction): MilitoPlayerState {
  return {
    oderId: playerId,
    faction,
    table: createInitialTable(),
    hand: createInitialHand(),
    phase: MILITO_SELECT_CARD,
    cardsToDiscard: 0,
    selectedCard: undefined,
    selectedColumn: undefined,
    discardedCards: [],
    score: 0,
  }
}

export const militoRoutes = new ApiRouter({ prefix: '/api/milito' })
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

      const stateRow = await db
        .select()
        .from(gameState)
        .where(eq(gameState.roomId, params.roomId))
        .limit(1)

      if (!stateRow[0]) {
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

      const state = stateRow[0].state as MilitoGameState
      const myPlayerState = state.players[user.id]

      return {
        room: room[0],
        gameState: state,
        myState: myPlayerState,
        players,
        isMyTurn: state.currentPlayerId === user.id,
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

      // Verify this is a Milito room
      const game = await db.select().from(games).where(eq(games.id, room[0].gameId)).limit(1)
      if (!game[0] || game[0].id !== 'milito') {
        set.status = 400
        return { error: 'Bad request', message: 'This room is not a Milito game' }
      }

      if (room[0].hostId !== user.id) {
        set.status = 403
        return { error: 'Forbidden', message: 'Only host can initialize the game' }
      }

      const players = await db.select().from(gamePlayers).where(eq(gamePlayers.roomId, params.roomId))

      if (players.length !== 2) {
        set.status = 400
        return { error: 'Bad request', message: 'Milito requires exactly 2 players' }
      }

      const factions: MilitoFaction[] = ['ancient_british', 'alexandrian_macedonian']
      const playerStates: Record<string, MilitoPlayerState> = {}

      players.forEach((player, idx) => {
        playerStates[player.userId] = createPlayerState(player.userId, factions[idx])
      })

      const initialState: MilitoGameState = {
        players: playerStates,
        currentPlayerId: players[0].userId,
        turnNumber: 1,
        status: 'playing',
      }

      await db
        .insert(gameState)
        .values({
          roomId: params.roomId,
          state: initialState,
          currentTurn: 1,
        })
        .onConflictDoUpdate({
          target: gameState.roomId,
          set: {
            state: initialState,
            currentTurn: 1,
            updatedAt: new Date(),
          },
        })

      await db
        .update(gameRooms)
        .set({ status: 'playing' })
        .where(eq(gameRooms.id, params.roomId))

      return { success: true }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    '/:roomId/select-card',
    async ({ params, body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
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

      const state = stateRow[0].state as MilitoGameState

      if (state.currentPlayerId !== user.id) {
        set.status = 400
        return { error: 'Bad request', message: 'Not your turn' }
      }

      const playerState = state.players[user.id]
      if (playerState.phase !== MILITO_SELECT_CARD) {
        set.status = 400
        return { error: 'Bad request', message: 'Not in card selection phase' }
      }

      if (body.cardIndex < 0 || body.cardIndex >= playerState.hand.length) {
        set.status = 400
        return { error: 'Bad request', message: 'Invalid card index' }
      }

      playerState.selectedCard = body.cardIndex
      playerState.phase = MILITO_SELECT_COLUMN

      await db
        .update(gameState)
        .set({ state, updatedAt: new Date() })
        .where(eq(gameState.roomId, params.roomId))

      return { success: true, state }
    },
    {
      params: t.Object({ roomId: t.String() }),
      body: t.Object({ cardIndex: t.Number() }),
    },
  )
  .post(
    '/:roomId/select-column',
    async ({ params, body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
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

      const state = stateRow[0].state as MilitoGameState

      if (state.currentPlayerId !== user.id) {
        set.status = 400
        return { error: 'Bad request', message: 'Not your turn' }
      }

      const playerState = state.players[user.id]
      if (playerState.phase !== MILITO_SELECT_COLUMN) {
        set.status = 400
        return { error: 'Bad request', message: 'Not in column selection phase' }
      }

      if (body.columnIndex < 0 || body.columnIndex >= 5) {
        set.status = 400
        return { error: 'Bad request', message: 'Invalid column index' }
      }

      playerState.selectedColumn = body.columnIndex
      playerState.cardsToDiscard = 1
      playerState.phase = MILITO_DISCARD

      await db
        .update(gameState)
        .set({ state, updatedAt: new Date() })
        .where(eq(gameState.roomId, params.roomId))

      return { success: true, state }
    },
    {
      params: t.Object({ roomId: t.String() }),
      body: t.Object({ columnIndex: t.Number() }),
    },
  )
  .post(
    '/:roomId/discard',
    async ({ params, body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
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

      const state = stateRow[0].state as MilitoGameState

      if (state.currentPlayerId !== user.id) {
        set.status = 400
        return { error: 'Bad request', message: 'Not your turn' }
      }

      const playerState = state.players[user.id]
      if (playerState.phase !== MILITO_DISCARD) {
        set.status = 400
        return { error: 'Bad request', message: 'Not in discard phase' }
      }

      if (body.cardIndex < 0 || body.cardIndex >= playerState.hand.length) {
        set.status = 400
        return { error: 'Bad request', message: 'Invalid card index' }
      }

      // Can't discard the selected card
      if (body.cardIndex === playerState.selectedCard) {
        set.status = 400
        return { error: 'Bad request', message: 'Cannot discard the card you are playing' }
      }

      playerState.discardedCards.push(body.cardIndex)
      playerState.cardsToDiscard--

      if (playerState.cardsToDiscard <= 0) {
        // Execute the turn: place card on board
        const cardValue = playerState.hand[playerState.selectedCard!]
        const column = playerState.selectedColumn!

        // Place card in player_row_1 if empty, otherwise player_row_2
        if (playerState.table.player_row_1[column] === null) {
          playerState.table.player_row_1[column] = cardValue
        } else if (playerState.table.player_row_2[column] === null) {
          playerState.table.player_row_2[column] = cardValue
        }

        // Remove discarded and played cards from hand
        const indicesToRemove = new Set([...playerState.discardedCards, playerState.selectedCard!])
        const newHand = playerState.hand.filter((_, idx) => !indicesToRemove.has(idx))

        // Draw cards to get back to 5
        while (newHand.length < 5) {
          newHand.push(Math.floor(Math.random() * 5))
        }

        playerState.hand = newHand
        playerState.phase = MILITO_SELECT_CARD
        playerState.selectedCard = undefined
        playerState.selectedColumn = undefined
        playerState.discardedCards = []

        // Switch to other player
        const playerIds = Object.keys(state.players)
        const currentIndex = playerIds.indexOf(user.id)
        state.currentPlayerId = playerIds[(currentIndex + 1) % playerIds.length]
        state.turnNumber++
      }

      await db
        .update(gameState)
        .set({ state, currentTurn: state.turnNumber, updatedAt: new Date() })
        .where(eq(gameState.roomId, params.roomId))

      return { success: true, state }
    },
    {
      params: t.Object({ roomId: t.String() }),
      body: t.Object({ cardIndex: t.Number() }),
    },
  )
