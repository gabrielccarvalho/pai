'use client'

import type { Column, Task } from '../../../lib/types'
import { CellText } from './cell-text'
import { CellNumber } from './cell-number'
import { CellSelect } from './cell-select'
import { CellDate } from './cell-date'
import { CellUrl } from './cell-url'

interface CellProps {
  column: Column
  task: Task
  onUpdate: (values: Record<string, unknown>) => void
  onCreateOption?: (columnId: string, label: string) => Promise<void>
  onUpdateOption?: (optionId: string, color: string | null) => Promise<void>
  multiline?: boolean
}

export function Cell({ column, task, onUpdate, onCreateOption, onUpdateOption, multiline }: CellProps) {
  const value = task.values[column.id]

  function update(newValue: unknown) {
    onUpdate({ ...task.values, [column.id]: newValue })
  }

  switch (column.type) {
    case 'text':
      return (
        <CellText
          value={(value as string) ?? ''}
          onChange={update}
          multiline={multiline}
        />
      )

    case 'number_integer':
    case 'number_float':
    case 'number_hour':
      return (
        <CellNumber
          value={value !== undefined && value !== null ? Number(value) : null}
          onChange={update}
          type={column.type}
        />
      )

    case 'select':
      return (
        <CellSelect
          value={(value as string) ?? null}
          options={column.options}
          onChange={update}
          onCreateOption={
            onCreateOption
              ? async (label) => {
                  await onCreateOption(column.id, label)
                  // Return a placeholder — the parent re-fetches and updates options
                  return { id: '', label, color: null, order: 0, columnId: column.id }
                }
              : undefined
          }
          onUpdateOption={onUpdateOption}
        />
      )

    case 'multiselect':
      return (
        <CellSelect
          multi
          value={null}
          multiValue={(value as string[]) ?? []}
          options={column.options}
          onChange={() => {}}
          onMultiChange={update}
          onCreateOption={
            onCreateOption
              ? async (label) => {
                  await onCreateOption(column.id, label)
                  return { id: '', label, color: null, order: 0, columnId: column.id }
                }
              : undefined
          }
          onUpdateOption={onUpdateOption}
        />
      )

    case 'date':
      return (
        <CellDate
          value={(value as string) ?? null}
          onChange={update}
        />
      )

    case 'url':
      return (
        <CellUrl
          value={(value as string) ?? null}
          onChange={update}
        />
      )

    default:
      return <div className="px-3 py-2 text-sm text-muted-foreground">—</div>
  }
}
