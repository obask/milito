import { For } from 'solid-js'
import { MilitoCard } from './MilitoCard'
import { MilitoPlaceholder } from './MilitoPlaceholder'
import type { MilitoFaction, MilitoPlayerTable, MilitoUnitType } from '@app/shared'
import { MILITO_UNIT_TYPES } from '@app/shared'

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

export function MilitoBoard(props: MilitoBoardProps) {
  const renderRow = (
    row: (number | null)[],
    rowFaction: MilitoFaction,
    clickable: boolean,
    rotated: boolean = false,
  ) => (
    <tr>
      <For each={row}>
        {(value, index) => {
          const unitType = getUnitType(value)
          return (
            <td class="p-1">
              {unitType ? (
                <MilitoCard
                  unitType={unitType}
                  faction={rowFaction}
                  onClick={clickable ? () => props.onColumnClick?.(index()) : undefined}
                  rotated={rotated}
                />
              ) : (
                <MilitoPlaceholder
                  onClick={clickable ? () => props.onColumnClick?.(index()) : undefined}
                  highlighted={props.selectingColumn && clickable}
                />
              )}
            </td>
          )
        }}
      </For>
    </tr>
  )

  return (
    <div class="bg-amber-100 p-4 rounded-lg inline-block">
      <table>
        <tbody>
          {/* Enemy rows (top) - opponent's perspective */}
          {renderRow(props.table.enemy_row_2, props.opponentFaction, false)}
          {renderRow(props.table.enemy_row_1, props.opponentFaction, false)}
          {/* Territory row (middle) - contested */}
          {renderRow(props.table.territory_row, props.faction, props.selectingColumn || false, true)}
          {/* Player rows (bottom) - your units */}
          {renderRow(props.table.player_row_1, props.faction, props.selectingColumn || false)}
          {renderRow(props.table.player_row_2, props.faction, props.selectingColumn || false)}
        </tbody>
      </table>
    </div>
  )
}
