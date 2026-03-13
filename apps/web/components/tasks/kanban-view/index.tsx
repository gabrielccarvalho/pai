'use client'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import { useId, useState } from 'react'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { getStatusColumn } from '../../../lib/task-utils'
import type { Task, TaskBoard } from '../../../lib/types'

interface KanbanViewProps {
  board: TaskBoard
  onAddTask: (statusOptionId?: string) => Promise<Task | undefined>
  onDeleteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, values: Record<string, unknown>) => Promise<void>
  onCreateOption: (columnId: string, label: string) => Promise<void>
  onUpdateOption: (optionId: string, color: string | null) => Promise<void>
}

export function KanbanView({ board, onAddTask, onDeleteTask, onUpdateTask, onCreateOption, onUpdateOption }: KanbanViewProps) {
  const dndId = useId()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const statusCol = getStatusColumn(board.columns)

  if (!statusCol) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        No select column found to group by. Add a &quot;Status&quot; column first.
      </div>
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTaskId(null)
    if (!over) return

    const taskId = active.id as string
    const newOptionId = over.id === '__no_status__' ? null : (over.id as string)
    const task = board.tasks.find((t) => t.id === taskId)
    if (!task) return

    const currentOptionId = task.values[statusCol!.id] ?? null
    if (currentOptionId === newOptionId) return

    const newValues = { ...task.values }
    if (newOptionId === null) {
      delete newValues[statusCol!.id]
    } else {
      newValues[statusCol!.id] = newOptionId
    }
    onUpdateTask(taskId, newValues)
  }

  const activeTask = activeTaskId ? board.tasks.find((t) => t.id === activeTaskId) : null
  const noStatusTasks = board.tasks.filter((t) => !t.values[statusCol.id])

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveTaskId(e.active.id as string)}
      onDragCancel={() => setActiveTaskId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-6 pb-8">
        {statusCol.options.map((opt) => {
          const tasks = board.tasks.filter((t) => t.values[statusCol.id] === opt.id)
          return (
            <KanbanColumn
              key={opt.id}
              droppableId={opt.id}
              option={opt}
              label={opt.label}
              tasks={tasks}
              columns={board.columns}
              activeTaskId={activeTaskId}
              onAddTask={() => onAddTask(opt.id)}
              onDeleteTask={onDeleteTask}
              onUpdateTask={onUpdateTask}
              onCreateOption={onCreateOption}
              onUpdateOption={onUpdateOption}
            />
          )
        })}

        {noStatusTasks.length > 0 && (
          <KanbanColumn
            droppableId="__no_status__"
            option={null}
            label="No status"
            tasks={noStatusTasks}
            columns={board.columns}
            activeTaskId={activeTaskId}
            onAddTask={() => onAddTask(undefined)}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onCreateOption={onCreateOption}
            onUpdateOption={onUpdateOption}
          />
        )}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            columns={board.columns}
            onDelete={() => {}}
            isDragOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
