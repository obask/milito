import { For, Show } from 'solid-js'
import { MilitoCard } from './MilitoCard'
import type { MilitoFaction, MilitoUnitType } from '@app/shared'
import { MILITO_UNIT_TYPES } from '@app/shared'

interface MilitoHandProps {
  hand: number[]
  faction: MilitoFaction
  onCardClick?: (index: number) => void
  selectedCard?: number
  discardedCards?: number[]
  disabled?: boolean
}

export function MilitoHand(props: MilitoHandProps) {
  const discardedCards = () => props.discardedCards ?? []

  return (
    <div class="flex gap-2 justify-center p-4 bg-gray-800 rounded-lg">
      <For each={props.hand}>
        {(cardValue, index) => {
          const unitType = MILITO_UNIT_TYPES[cardValue] as MilitoUnitType
          const isDiscarded = () => discardedCards().includes(index())

          return (
            <Show
              when={!isDiscarded()}
              fallback={<div class="w-20 h-28" />}
            >
              <MilitoCard
                unitType={unitType}
                faction={props.faction}
                onClick={() => props.onCardClick?.(index())}
                selected={props.selectedCard === index()}
                disabled={props.disabled}
              />
            </Show>
          )
        }}
      </For>
    </div>
  )
}
