'use client'

import { KanbanColumn } from './kanban-column'
import type { Column, Task, TaskBoard } from '../../../lib/types'

interface KanbanViewProps {
  board: TaskBoard
  onAddTask: (statusOptionId?: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
}

export function KanbanView({ board, onAddTask, onDeleteTask }: KanbanViewProps) {
  // Find the Status column (first select column, or one named "Status")
  const statusCol: Column | undefined =
    board.columns.find((c) => c.name.toLowerCase() === 'status' && c.type === 'select') ??
    board.columns.find((c) => c.type === 'select')

  if (!statusCol) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        No select column found to group by. Add a &quot;Status&quot; column first.
      </div>
    )
  }

  // Tasks with no status value
  const noStatusTasks = board.tasks.filter(
    (t) => !t.values[statusCol.id],
  )

  return (
    <div className="flex gap-4 overflow-x-auto p-6 pb-8">
      {statusCol.options.map((opt) => {
        const tasks = board.tasks.filter((t) => t.values[statusCol.id] === opt.id)
        return (
          <KanbanColumn
            key={opt.id}
            option={opt}
            label={opt.label}
            tasks={tasks}
            columns={board.columns}
            onAddTask={async () => {
              await onAddTask(opt.id)
            }}
            onDeleteTask={onDeleteTask}
          />
        )
      })}

      {noStatusTasks.length > 0 && (
        <KanbanColumn
          option={null}
          label="No status"
          tasks={noStatusTasks}
          columns={board.columns}
          onAddTask={() => onAddTask(undefined)}
          onDeleteTask={onDeleteTask}
        />
      )}
    </div>
  )
}
