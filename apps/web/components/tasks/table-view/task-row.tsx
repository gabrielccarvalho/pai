'use client'

import { useState } from 'react'
import { Delete01Icon } from '@/components/icons'
import { Cell } from './cell'
import { cn } from '@workspace/ui/lib/utils'
import type { Column, Task } from '../../../lib/types'

interface TaskRowProps {
  task: Task
  columns: Column[]
  colWidths: Record<string, number>
  onUpdateValues: (values: Record<string, unknown>) => void
  onCreateOption: (columnId: string, label: string) => Promise<void>
  onDelete: () => void
}

export function TaskRow({ task, columns, colWidths, onUpdateValues, onCreateOption, onDelete }: TaskRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-stretch border-b border-border last:border-b-0 min-h-[36px]',
        hovered && 'bg-muted/30',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row action */}
      <div className="flex w-8 shrink-0 items-center justify-center">
        <button
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100',
          )}
          onClick={onDelete}
          title="Delete task"
        >
          <Delete01Icon className="h-3.5 w-3.5" />
        </button>
      </div>

      {columns.map((col) => (
        <div
          key={col.id}
          className="shrink-0 border-l border-border"
          style={{ width: colWidths[col.id] ?? 160 }}
        >
          <Cell
            column={col}
            task={task}
            onUpdate={onUpdateValues}
            onCreateOption={onCreateOption}
          />
        </div>
      ))}
    </div>
  )
}
