'use client'

import { format, parseISO } from 'date-fns'
import { Badge } from '@workspace/ui/components/badge'
import { Delete01Icon } from '@/components/icons'
import type { Column, ColumnOption, Task } from '../../../lib/types'

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
}

interface KanbanCardProps {
  task: Task
  columns: Column[]
  onDelete: () => void
}

function getOptionLabel(columns: Column[], columnName: string, value: unknown): ColumnOption | null {
  const col = columns.find((c) => c.name.toLowerCase() === columnName.toLowerCase())
  if (!col || !value) return null
  return col.options.find((o) => o.id === value) ?? null
}

function getTitleValue(task: Task, columns: Column[]): string {
  const titleCol = columns.find((c) => c.name.toLowerCase() === 'title')
  if (!titleCol) {
    // Fallback: first text column
    const textCol = columns.find((c) => c.type === 'text')
    if (!textCol) return 'Untitled'
    return (task.values[textCol.id] as string) || 'Untitled'
  }
  return (task.values[titleCol.id] as string) || 'Untitled'
}

export function KanbanCard({ task, columns, onDelete }: KanbanCardProps) {
  const title = getTitleValue(task, columns)
  const priorityOpt = getOptionLabel(columns, 'priority', task.values[
    columns.find((c) => c.name.toLowerCase() === 'priority')?.id ?? ''
  ])
  const dueDateCol = columns.find((c) => c.name.toLowerCase() === 'due date' || c.type === 'date')
  const dueDate = dueDateCol ? (task.values[dueDateCol.id] as string) : null

  const priorityColor = priorityOpt
    ? PRIORITY_COLORS[priorityOpt.label.toLowerCase()] ?? priorityOpt.color
    : null

  return (
    <div className="group relative rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <button
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded opacity-0 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        onClick={onDelete}
        title="Delete task"
      >
        <Delete01Icon className="h-3.5 w-3.5" />
      </button>

      <p className="pr-6 text-sm font-medium leading-snug">{title}</p>

      {(priorityOpt || dueDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {priorityOpt && (
            <Badge
              variant="secondary"
              className="text-[10px]"
              style={
                priorityColor
                  ? {
                      backgroundColor: priorityColor + '22',
                      borderColor: priorityColor + '55',
                      color: priorityColor,
                    }
                  : {}
              }
            >
              {priorityOpt.label}
            </Badge>
          )}
          {dueDate && (
            <span className="text-[10px] text-muted-foreground">
              {format(parseISO(dueDate), 'MMM d')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
