import { Show } from 'solid-js'
import { MilitoBoard } from './MilitoBoard'
import { MilitoHand } from './MilitoHand'
import type { MilitoGameState, MilitoPlayerState, MilitoFaction } from '@app/shared'

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

export function MilitoGame(props: MilitoGameProps) {
  const opponentFaction = (): MilitoFaction =>
    props.myState.faction === 'ancient_british' ? 'alexandrian_macedonian' : 'ancient_british'

  const handleCardClick = (index: number) => {
    if (!props.isMyTurn) return

    if (props.myState.phase === 'SELECT_CARD') {
      props.onSelectCard(index)
    } else if (props.myState.phase === 'DISCARD') {
      if (index !== props.myState.selectedCard) {
        props.onDiscard(index)
      }
    }
  }

  const handleColumnClick = (columnIndex: number) => {
    if (!props.isMyTurn || props.myState.phase !== 'SELECT_COLUMN') return
    props.onSelectColumn(columnIndex)
  }

  return (
    <div class="flex flex-col items-center gap-6 p-4">
      {/* Status */}
      <div class="text-center">
        <p class="text-lg font-semibold">
          <Show
            when={props.isMyTurn}
            fallback={<span class="text-gray-400">Waiting for opponent...</span>}
          >
            <span class="text-green-400">Your turn</span>
          </Show>
        </p>
        <Show when={props.isMyTurn}>
          <p class="text-sm text-gray-300">{PHASE_LABELS[props.myState.phase]}</p>
        </Show>
        <p class="text-xs text-gray-500 mt-1">Turn {props.gameState.turnNumber}</p>
      </div>

      {/* Game Board */}
      <MilitoBoard
        table={props.myState.table}
        faction={props.myState.faction}
        opponentFaction={opponentFaction()}
        onColumnClick={handleColumnClick}
        selectingColumn={props.isMyTurn && props.myState.phase === 'SELECT_COLUMN'}
      />

      {/* Your Hand */}
      <div class="w-full max-w-2xl">
        <h3 class="text-sm font-medium text-gray-400 mb-2 text-center">Your Hand</h3>
        <MilitoHand
          hand={props.myState.hand}
          faction={props.myState.faction}
          onCardClick={handleCardClick}
          selectedCard={props.myState.selectedCard}
          discardedCards={props.myState.discardedCards}
          disabled={!props.isMyTurn}
        />
      </div>

      {/* Debug info */}
      <details class="text-xs text-gray-500 w-full max-w-2xl">
        <summary class="cursor-pointer">Debug State</summary>
        <pre class="bg-gray-900 p-2 rounded mt-2 overflow-auto">
          {JSON.stringify({ phase: props.myState.phase, hand: props.myState.hand, selectedCard: props.myState.selectedCard }, null, 2)}
        </pre>
      </details>
    </div>
  )
}
