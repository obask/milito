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

export function MilitoHand({
  hand,
  faction,
  onCardClick,
  selectedCard,
  discardedCards = [],
  disabled,
}: MilitoHandProps) {
  return (
    <div className="flex gap-2 justify-center p-4 bg-gray-800 rounded-lg">
      {hand.map((cardValue, index) => {
        const unitType = MILITO_UNIT_TYPES[cardValue] as MilitoUnitType
        const isDiscarded = discardedCards.includes(index)

        if (isDiscarded) {
          return <div key={index} className="w-20 h-28" /> // Empty space for discarded
        }

        return (
          <MilitoCard
            key={index}
            unitType={unitType}
            faction={faction}
            onClick={() => onCardClick?.(index)}
            selected={selectedCard === index}
            disabled={disabled}
          />
        )
      })}
    </div>
  )
}
