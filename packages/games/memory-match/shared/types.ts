// Memory Match Game Types

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
