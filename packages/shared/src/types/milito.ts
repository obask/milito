// Milito Game Types

export type MilitoFaction = 'alexandrian_macedonian' | 'ancient_british'

export const MILITO_UNIT_TYPES = [
  'light_cavalry',
  'slingers',
  'leader_2',
  'chariots',
  'heavy_cavalry',
] as const

export type MilitoUnitType = (typeof MILITO_UNIT_TYPES)[number]

export interface MilitoCard {
  id?: number
  unitType: MilitoUnitType
}

export interface MilitoPlayerTable {
  enemy_row_2: (number | null)[]
  enemy_row_1: (number | null)[]
  territory_row: number[]
  player_row_1: (number | null)[]
  player_row_2: (number | null)[]
}

// Game state phases
export const MILITO_SELECT_CARD = 'SELECT_CARD'
export const MILITO_SELECT_COLUMN = 'SELECT_COLUMN'
export const MILITO_DISCARD = 'DISCARD'

export type MilitoPhase =
  | typeof MILITO_SELECT_CARD
  | typeof MILITO_SELECT_COLUMN
  | typeof MILITO_DISCARD

export interface MilitoPlayerState {
  oderId: string
  faction: MilitoFaction
  table: MilitoPlayerTable
  hand: number[]
  phase: MilitoPhase
  cardsToDiscard: number
  selectedCard?: number
  selectedColumn?: number
  discardedCards: number[]
  score: number
}

export interface MilitoGameState {
  players: Record<string, MilitoPlayerState>
  currentPlayerId: string
  turnNumber: number
  status: 'playing' | 'finished'
  winnerId?: string
}
