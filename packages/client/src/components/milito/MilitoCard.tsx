import type { MilitoFaction, MilitoUnitType } from '@app/shared'

interface MilitoCardProps {
  unitType?: MilitoUnitType
  faction: MilitoFaction
  onClick?: () => void
  rotated?: boolean
  selected?: boolean
  disabled?: boolean
}

const factionPrefix: Record<MilitoFaction, string> = {
  ancient_british: 'ab',
  alexandrian_macedonian: 'am',
}

export function MilitoCard(props: MilitoCardProps) {
  const prefix = () => factionPrefix[props.faction]
  const imagePath = () => props.unitType
    ? `/assets/milito/${props.faction}/${prefix()}_${props.unitType}.jpeg`
    : '/assets/milito/plain.jpeg'

  return (
    <img
      src={imagePath()}
      width={80}
      height={112}
      alt={props.unitType || 'card back'}
      onClick={props.disabled ? undefined : props.onClick}
      class={`
        cursor-pointer transition-all
        ${props.rotated ? 'rotate-90' : ''}
        ${props.selected ? 'ring-4 ring-yellow-400 scale-105' : ''}
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
      `}
    />
  )
}
