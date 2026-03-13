"use client"

import { useState, useEffect, useCallback } from "react"
import { ViewSwitcher, type TaskView } from "./view-switcher"
import { TableView } from "./table-view"
import { KanbanView } from "./kanban-view"
import type { Column, ColumnType, TaskBoard } from "../../lib/types"

const VIEW_STORAGE_KEY = "pai:task-view"

interface TaskBoardProps {
  initialBoard: TaskBoard
}

export function TaskBoardClient({ initialBoard }: TaskBoardProps) {
  const [board, setBoard] = useState<TaskBoard>(initialBoard)
  const [view, setView] = useState<TaskView>(() => {
    if (typeof window === "undefined") return "table"
    return (localStorage.getItem(VIEW_STORAGE_KEY) as TaskView) ?? "table"
  })

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  }, [view])

  // Re-fetch the full board (to get fresh options after creates)
  const refetch = useCallback(async () => {
    const res = await fetch(`/api/boards/${board.id}`)
    if (res.ok) setBoard(await res.json())
  }, [board.id])

  async function handleAddTask(statusOptionId?: string) {
    const statusCol = board.columns.find(
      (c) => c.name.toLowerCase() === "status" && c.type === "select"
    )
    const initialValues: Record<string, unknown> = {}
    if (statusCol && statusOptionId) {
      initialValues[statusCol.id] = statusOptionId
    }
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: board.id, values: initialValues }),
    })
    if (res.ok) {
      const task = await res.json()
      setBoard((b) => ({ ...b, tasks: [...b.tasks, task] }))
    }
  }

  async function handleUpdateTask(
    taskId: string,
    values: Record<string, unknown>
  ) {
    setBoard((b) => ({
      ...b,
      tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, values } : t)),
    }))
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    })
  }

  async function handleDeleteTask(taskId: string) {
    setBoard((b) => ({ ...b, tasks: b.tasks.filter((t) => t.id !== taskId) }))
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
  }

  async function handleAddColumn(name: string, type: ColumnType) {
    const res = await fetch(`/api/boards/${board.id}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    })
    if (res.ok) {
      const col: Column = await res.json()
      setBoard((b) => ({
        ...b,
        columns: [...b.columns, col].sort((a, b) => a.order - b.order),
      }))
    }
  }

  async function handleRenameColumn(columnId: string, name: string) {
    setBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === columnId ? { ...c, name } : c)),
    }))
    await fetch(`/api/columns/${columnId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
  }

  async function handleResizeColumn(columnId: string, width: number) {
    setBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === columnId ? { ...c, width } : c)),
    }))
    await fetch(`/api/columns/${columnId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ width }),
    })
  }

  async function handleChangeIcon(columnId: string, icon: string | null) {
    setBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === columnId ? { ...c, icon } : c)),
    }))
    await fetch(`/api/columns/${columnId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon }),
    })
  }

  async function handleDeleteColumn(columnId: string) {
    setBoard((b) => ({
      ...b,
      columns: b.columns.filter((c) => c.id !== columnId),
    }))
    await fetch(`/api/columns/${columnId}`, { method: "DELETE" })
  }

  async function handleReorderColumns(columnIds: string[]) {
    setBoard((b) => ({
      ...b,
      columns: columnIds.map((id, index) => {
        const col = b.columns.find((c) => c.id === id)!
        return { ...col, order: index }
      }),
    }))
    await fetch(`/api/boards/${board.id}/columns`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: columnIds.map((id, index) => ({ id, order: index })),
      }),
    })
  }

  async function handleUpdateOption(optionId: string, color: string | null) {
    setBoard((b) => ({
      ...b,
      columns: b.columns.map((col) => ({
        ...col,
        options: col.options.map((opt) =>
          opt.id === optionId ? { ...opt, color } : opt
        ),
      })),
    }))
    await fetch(`/api/column-options/${optionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    })
  }

  async function handleCreateOption(columnId: string, label: string) {
    const res = await fetch("/api/column-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, label }),
    })
    if (res.ok) await refetch()
  }

  return (
    <div className="flex h-full flex-col gap-12">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-semibold">{board.name}</h1>
        <ViewSwitcher view={view} onChange={setView} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "table" ? (
          <TableView
            board={board}
            onAddTask={() => handleAddTask()}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddColumn={handleAddColumn}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
            onReorderColumns={handleReorderColumns}
            onChangeIcon={handleChangeIcon}
            onResizeColumn={handleResizeColumn}
            onCreateOption={handleCreateOption}
            onUpdateOption={handleUpdateOption}
          />
        ) : (
          <KanbanView
            board={board}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </div>
    </div>
  )
}
