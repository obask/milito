import type { MilitoFaction, MilitoUnitType } from '#/shared'

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

export function MilitoCard({
  unitType,
  faction,
  onClick,
  rotated,
  selected,
  disabled,
}: MilitoCardProps) {
  const prefix = factionPrefix[faction]
  const imagePath = unitType
    ? `/assets/milito/${faction}/${prefix}_${unitType}.jpeg`
    : '/assets/milito/plain.jpeg'

  return (
    <img
      src={imagePath}
      width={80}
      height={112}
      alt={unitType || 'card back'}
      onClick={disabled ? undefined : onClick}
      className={`
        cursor-pointer transition-all
        ${rotated ? 'rotate-90' : ''}
        ${selected ? 'ring-4 ring-yellow-400 scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
      `}
    />
  )
}
