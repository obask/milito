import { MilitoCard } from './MilitoCard'
import { MilitoPlaceholder } from './MilitoPlaceholder'
import type { MilitoFaction, MilitoPlayerTable, MilitoUnitType } from '#/shared'
import { MILITO_UNIT_TYPES } from '#/shared'

interface MilitoBoardProps {
  table: MilitoPlayerTable
  faction: MilitoFaction
  opponentFaction: MilitoFaction
  onColumnClick?: (columnIndex: number) => void
  selectingColumn?: boolean
}

function getUnitType(value: number | null): MilitoUnitType | undefined {
  if (value === null || value < 0) return undefined
  return MILITO_UNIT_TYPES[value] as MilitoUnitType
}

export function MilitoBoard({
  table,
  faction,
  opponentFaction,
  onColumnClick,
  selectingColumn,
}: MilitoBoardProps) {
  const renderRow = (
    row: (number | null)[],
    rowFaction: MilitoFaction,
    clickable: boolean,
    rotated: boolean = false,
  ) => (
    <tr>
      {row.map((value, index) => {
        const unitType = getUnitType(value)
        return (
          <td key={index} className="p-1">
            {unitType ? (
              <MilitoCard
                unitType={unitType}
                faction={rowFaction}
                onClick={clickable ? () => onColumnClick?.(index) : undefined}
                rotated={rotated}
              />
            ) : (
              <MilitoPlaceholder
                onClick={clickable ? () => onColumnClick?.(index) : undefined}
                highlighted={selectingColumn && clickable}
              />
            )}
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className="bg-amber-100 p-4 rounded-lg inline-block">
      <table>
        <tbody>
          {/* Enemy rows (top) - opponent's perspective */}
          {renderRow(table.enemy_row_2, opponentFaction, false)}
          {renderRow(table.enemy_row_1, opponentFaction, false)}
          {/* Territory row (middle) - contested */}
          {renderRow(table.territory_row, faction, selectingColumn || false, true)}
          {/* Player rows (bottom) - your units */}
          {renderRow(table.player_row_1, faction, selectingColumn || false)}
          {renderRow(table.player_row_2, faction, selectingColumn || false)}
        </tbody>
      </table>
    </div>
  )
}
