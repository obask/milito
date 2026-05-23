import { MilitoBoard } from './MilitoBoard'
import { MilitoHand } from './MilitoHand'
import type { MilitoGameState, MilitoPlayerState, MilitoFaction } from '#/shared'

interface MilitoGameProps {
  gameState: MilitoGameState
  myState: MilitoPlayerState
  isMyTurn: boolean
  onSelectCard: (cardIndex: number) => void
  onSelectColumn: (columnIndex: number) => void
  onDiscard: (cardIndex: number) => void
}

const PHASE_LABELS = {
  SELECT_CARD: 'Select a card to play',
  SELECT_COLUMN: 'Select a column to place your unit',
  DISCARD: 'Discard a card from your hand',
}

export function MilitoGame({
  gameState,
  myState,
  isMyTurn,
  onSelectCard,
  onSelectColumn,
  onDiscard,
}: MilitoGameProps) {
  const opponentFaction: MilitoFaction =
    myState.faction === 'ancient_british' ? 'alexandrian_macedonian' : 'ancient_british'

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return

    if (myState.phase === 'SELECT_CARD') {
      onSelectCard(index)
    } else if (myState.phase === 'DISCARD') {
      if (index !== myState.selectedCard) {
        onDiscard(index)
      }
    }
  }

  const handleColumnClick = (columnIndex: number) => {
    if (!isMyTurn || myState.phase !== 'SELECT_COLUMN') return
    onSelectColumn(columnIndex)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Status */}
      <div className="text-center">
        <p className="text-lg font-semibold">
          {isMyTurn ? (
            <span className="text-green-400">Your turn</span>
          ) : (
            <span className="text-gray-400">Waiting for opponent...</span>
          )}
        </p>
        {isMyTurn && (
          <p className="text-sm text-gray-300">{PHASE_LABELS[myState.phase]}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Turn {gameState.turnNumber}</p>
      </div>

      {/* Game Board */}
      <MilitoBoard
        table={myState.table}
        faction={myState.faction}
        opponentFaction={opponentFaction}
        onColumnClick={handleColumnClick}
        selectingColumn={isMyTurn && myState.phase === 'SELECT_COLUMN'}
      />

      {/* Your Hand */}
      <div className="w-full max-w-2xl">
        <h3 className="text-sm font-medium text-gray-400 mb-2 text-center">Your Hand</h3>
        <MilitoHand
          hand={myState.hand}
          faction={myState.faction}
          onCardClick={handleCardClick}
          selectedCard={myState.selectedCard}
          discardedCards={myState.discardedCards}
          disabled={!isMyTurn}
        />
      </div>

      {/* Debug info */}
      <details className="text-xs text-gray-500 w-full max-w-2xl">
        <summary className="cursor-pointer">Debug State</summary>
        <pre className="bg-gray-900 p-2 rounded mt-2 overflow-auto">
          {JSON.stringify({ phase: myState.phase, hand: myState.hand, selectedCard: myState.selectedCard }, null, 2)}
        </pre>
      </details>
    </div>
  )
}
