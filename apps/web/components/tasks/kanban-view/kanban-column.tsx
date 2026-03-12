'use client'

import { Add01Icon } from '@/components/icons'
import { KanbanCard } from './kanban-card'
import type { Column, ColumnOption, Task } from '../../../lib/types'

interface KanbanColumnProps {
  option: ColumnOption | null // null = "No status" column
  label: string
  tasks: Task[]
  columns: Column[]
  onAddTask: () => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
}

export function KanbanColumn({ option, label, tasks, columns, onAddTask, onDeleteTask }: KanbanColumnProps) {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        {option?.color && (
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: option.color }}
          />
        )}
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            columns={columns}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}
      </div>

      {/* Add task */}
      <button
        className="flex h-8 items-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/50 hover:text-foreground"
        onClick={onAddTask}
      >
        <Add01Icon className="h-3.5 w-3.5" />
        Add task
      </button>
    </div>
  )
}
