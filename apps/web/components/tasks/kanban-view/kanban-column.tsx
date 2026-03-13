'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Add01Icon } from '@/components/icons'
import { KanbanCard } from './kanban-card'
import { TaskEditModal } from './task-edit-modal'
import { cn } from '@workspace/ui/lib/utils'
import type { Column, ColumnOption, Task } from '../../../lib/types'

interface KanbanColumnProps {
  droppableId: string
  option: ColumnOption | null
  label: string
  tasks: Task[]
  columns: Column[]
  activeTaskId: string | null
  onAddTask: () => Promise<Task | undefined>
  onDeleteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, values: Record<string, unknown>) => Promise<void>
  onCreateOption: (columnId: string, label: string) => Promise<void>
  onUpdateOption: (optionId: string, color: string | null) => Promise<void>
}

export function KanbanColumn({
  droppableId,
  option,
  label,
  tasks,
  columns,
  activeTaskId,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onCreateOption,
  onUpdateOption,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  const [pendingEditTask, setPendingEditTask] = useState<Task | null>(null)

  async function handleAddTask() {
    const task = await onAddTask()
    if (task) setPendingEditTask(task)
  }

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

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 rounded-lg min-h-[48px] transition-colors",
          isOver && "bg-muted/50 ring-1 ring-border"
        )}
      >
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            columns={columns}
            onDelete={() => onDeleteTask(task.id)}
            onUpdateTask={onUpdateTask}
            onCreateOption={onCreateOption}
            onUpdateOption={onUpdateOption}
            isDragging={task.id === activeTaskId}
          />
        ))}
      </div>

      {/* Add task */}
      <button
        className="flex h-8 items-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/50 hover:text-foreground"
        onClick={handleAddTask}
      >
        <Add01Icon className="h-3.5 w-3.5" />
        Add task
      </button>

      {/* Auto-open edit modal for newly created task */}
      {pendingEditTask && (
        <TaskEditModal
          open
          onOpenChange={(open) => { if (!open) setPendingEditTask(null) }}
          task={
            // Use latest task data from tasks list if available, else fall back to pending
            tasks.find((t) => t.id === pendingEditTask.id) ?? pendingEditTask
          }
          columns={columns}
          onUpdateTask={onUpdateTask}
          onCreateOption={onCreateOption}
          onUpdateOption={onUpdateOption}
        />
      )}
    </div>
  )
}
