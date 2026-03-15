"use client"

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useId, useState, useEffect, useRef } from "react"
import confetti from "canvas-confetti"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { getStatusColumn, getDoneOption } from "../../../lib/task-utils"
import type { Column, Task, TaskBoard } from "../../../lib/types"

interface KanbanViewProps {
  board: TaskBoard
  onAddTask: (statusOptionId?: string) => Promise<Task | undefined>
  onDeleteTask: (taskId: string) => Promise<void>
  onUpdateTask: (
    taskId: string,
    values: Record<string, unknown>
  ) => Promise<void>
  onCreateOption: (columnId: string, label: string) => Promise<void>
  onUpdateOption: (optionId: string, color: string | null) => Promise<void>
}

type Items = Record<string, Task[]>

function buildItems(tasks: Task[], statusCol: Column): Items {
  const result: Items = { __no_status__: [] }
  for (const opt of statusCol.options) {
    result[opt.id] = []
  }
  for (const task of tasks) {
    const colId = task.values[statusCol.id] as string | undefined
    const key = colId && result[colId] !== undefined ? colId : "__no_status__"
    result[key]!.push(task)
  }
  for (const key of Object.keys(result)) {
    result[key]!.sort((a, b) => a.order - b.order)
  }
  return result
}

function findContainer(id: string, items: Items): string | undefined {
  if (id in items) return id
  return Object.keys(items).find((key) => items[key]!.some((t) => t.id === id))
}

export function KanbanView({
  board,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onCreateOption,
  onUpdateOption,
}: KanbanViewProps) {
  const dndId = useId()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const statusCol = getStatusColumn(board.columns)

  const [items, setItems] = useState<Items>(() =>
    statusCol ? buildItems(board.tasks, statusCol) : {}
  )

  // Sync items from props only when the board reference actually changes (not on every render)
  const boardRef = useRef(board)
  useEffect(() => {
    if (boardRef.current === board) return
    boardRef.current = board
    if (activeTaskId) return
    const col = getStatusColumn(board.columns)
    if (col) setItems(buildItems(board.tasks, col))
  }, [board, activeTaskId])

  // pointerWithin for precise hit-testing on cards; fall back to rect intersection for empty columns
  const collisionDetection: CollisionDetection = (args) => {
    const hits = pointerWithin(args)
    return hits.length > 0 ? hits : rectIntersection(args)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  if (!statusCol) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No select column found to group by. Add a &quot;Status&quot; column
        first.
      </div>
    )
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTaskId(active.id as string)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    setItems((prev) => {
      const activeContainer = findContainer(activeId, prev)
      const overContainer = findContainer(overId, prev)
      if (!activeContainer || !overContainer) return prev

      if (activeContainer === overContainer) {
        // Within-column reorder
        const oldIndex = prev[activeContainer]!.findIndex((t) => t.id === activeId)
        const newIndex = prev[activeContainer]!.findIndex((t) => t.id === overId)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev
        return { ...prev, [activeContainer]: arrayMove(prev[activeContainer]!, oldIndex, newIndex) }
      }

      // Cross-column move — skip if the active card is already at the same spot
      const activeItems = prev[activeContainer]!
      const overItems = prev[overContainer]!
      const activeIndex = activeItems.findIndex((t) => t.id === activeId)
      if (activeIndex === -1) return prev

      const overIndex = overItems.findIndex((t) => t.id === overId)

      let newIndex: number
      if (overId in prev) {
        newIndex = overItems.length
      } else {
        const isBelowOver =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2
        newIndex = overIndex >= 0 ? overIndex + (isBelowOver ? 1 : 0) : overItems.length
      }

      return {
        ...prev,
        [activeContainer]: prev[activeContainer]!.filter((t) => t.id !== activeId),
        [overContainer]: [
          ...prev[overContainer]!.slice(0, newIndex),
          activeItems[activeIndex]!,
          ...prev[overContainer]!.slice(newIndex),
        ],
      }
    })
  }

  function handleDragCancel() {
    setActiveTaskId(null)
    // Reset to server state on cancel
    const col = getStatusColumn(board.columns)
    if (col) setItems(buildItems(board.tasks, col))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTaskId(null)

    if (!over) {
      // Reset to server state if dropped outside
      const col = getStatusColumn(board.columns)
      if (col) setItems(buildItems(board.tasks, col))
      return
    }

    const activeId = active.id as string
    const task = board.tasks.find((t) => t.id === activeId)
    if (!task) return

    const targetContainer = findContainer(activeId, items)
    if (!targetContainer) return

    const newOptionId = targetContainer === "__no_status__" ? null : targetContainer
    const currentOptionId = (task.values[statusCol!.id] as string) ?? null

    if (currentOptionId !== newOptionId) {
      const doneOpt = getDoneOption(statusCol)
      if (doneOpt && newOptionId === doneOpt.id) {
        const rect = active.rect.current.translated
        confetti({
          particleCount: 60,
          spread: 70,
          origin: rect
            ? {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
              }
            : { x: 0.5, y: 0.6 },
          startVelocity: 20,
          gravity: 1.2,
          scalar: 0.8,
        })
      }

      const newValues = { ...task.values }
      if (newOptionId === null) {
        delete newValues[statusCol!.id]
      } else {
        newValues[statusCol!.id] = newOptionId
      }
      onUpdateTask(activeId, newValues)
    }
  }

  const activeTask = activeTaskId
    ? Object.values(items).flat().find((t) => t.id === activeTaskId)
    : null

  const noStatusTasks = items.__no_status__ ?? []

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex justify-center gap-4 overflow-x-auto p-6 pb-8"
        style={activeTaskId ? { cursor: "grabbing", userSelect: "none" } : undefined}
      >
        {statusCol.options.map((opt) => (
          <KanbanColumn
            key={opt.id}
            droppableId={opt.id}
            option={opt}
            label={opt.label}
            tasks={items[opt.id] ?? []}
            columns={board.columns}
            activeTaskId={activeTaskId}
            onAddTask={() => onAddTask(opt.id)}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onCreateOption={onCreateOption}
            onUpdateOption={onUpdateOption}
          />
        ))}

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
