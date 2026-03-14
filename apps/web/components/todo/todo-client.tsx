"use client"

import { useState, useEffect, useCallback } from "react"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  parseISO,
  isBefore,
  isAfter,
  isWithinInterval,
  getISOWeek,
  format,
} from "date-fns"
import { PageHeader } from "../page-header"
import { TodoItem } from "./todo-item"
import { TodoSection, type DateWindow, type SortOption } from "./todo-section"
import { InlineAddTodo } from "./inline-add-todo"
import { InlineEditTodo } from "./inline-edit-todo"
import type { Todo } from "../../lib/types"

const WINDOW_STORAGE_KEY = "pai:todo-window"

function getDateBounds(w: DateWindow) {
  const today = startOfDay(new Date())
  if (w === "today") {
    return { windowStart: today, windowEnd: endOfDay(today) }
  }
  return {
    windowStart: startOfWeek(today, { weekStartsOn: 1 }),
    windowEnd: endOfWeek(today, { weekStartsOn: 1 }),
  }
}

function isInWindow(todo: Todo, windowStart: Date, windowEnd: Date) {
  if (!todo.dueDate) return true
  return isWithinInterval(parseISO(todo.dueDate), {
    start: windowStart,
    end: windowEnd,
  })
}

function isOverdue(todo: Todo, windowStart: Date) {
  return todo.dueDate != null && isBefore(parseISO(todo.dueDate), windowStart)
}

function getCompletionPct(todo: Todo): number {
  if (todo.progress != null) return todo.progress
  if (todo.subTodos.length > 0) {
    return (todo.subTodos.filter((s) => s.completed).length / todo.subTodos.length) * 100
  }
  return todo.completed ? 100 : 0
}

function sortTodos(todos: Todo[], option: SortOption): Todo[] {
  const sorted = [...todos]
  if (option === "due-asc") {
    sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
  } else if (option === "due-desc") {
    sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return b.dueDate.localeCompare(a.dueDate)
    })
  } else if (option === "completion") {
    sorted.sort((a, b) => getCompletionPct(b) - getCompletionPct(a))
  }
  return sorted
}

interface WeekGroup {
  key: string
  label: string
  todos: Todo[]
}

function groupByWeek(todos: Todo[], direction: "asc" | "desc" = "desc"): WeekGroup[] {
  const groups = new Map<string, WeekGroup>()

  for (const todo of todos) {
    const date = parseISO(todo.dueDate!)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    const key = weekStart.toISOString()

    if (!groups.has(key)) {
      const weekNum = getISOWeek(date)
      const label = `Week ${weekNum} (${format(weekStart, "MMMM do")} – ${format(weekEnd, "MMMM do")})`
      groups.set(key, { key, label, todos: [] })
    }
    groups.get(key)!.todos.push(todo)
  }

  return Array.from(groups.values()).sort((a, b) =>
    direction === "desc" ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key)
  )
}

export function TodoClient() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [dateWindow, setDateWindow] = useState<DateWindow>(() => {
    if (typeof window === "undefined") return "today"
    return (localStorage.getItem(WINDOW_STORAGE_KEY) as DateWindow) ?? "today"
  })
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>("due-asc")

  useEffect(() => {
    localStorage.setItem(WINDOW_STORAGE_KEY, dateWindow)
  }, [dateWindow])

  const fetchTodos = useCallback(async () => {
    const res = await fetch("/api/todos")
    if (res.ok) {
      const data = await res.json()
      setTodos(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // ── Grouping ────────────────────────────────────────────────────────────────

  const { windowStart, windowEnd } = getDateBounds(dateWindow)

  // Overdue: strictly uncompleted todos past the window start
  const overdueActive = todos.filter(
    (t) => !t.completed && isOverdue(t, windowStart)
  )

  // Completed Cards: completed todos that were overdue (past the window start)
  const completedOverdue = todos.filter(
    (t) => t.completed && isOverdue(t, windowStart)
  )

  // Current window: todos within the window (no due date counts as current)
  const currentActive = todos.filter(
    (t) => !t.completed && isInWindow(t, windowStart, windowEnd)
  )
  const currentCompleted = todos.filter(
    (t) => t.completed && isInWindow(t, windowStart, windowEnd)
  )

  // Future: todos with due date strictly after the window end
  const futureAll = todos.filter(
    (t) => t.dueDate != null && isAfter(parseISO(t.dueDate), windowEnd)
  )

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSave(data: {
    title: string
    description: string | null
    dueDate: string | null
    progress: number | null
    eventId: string | null
    eventCalendarId: string | null
    eventSummary: string | null
    subTodos: { id?: string; title: string; completed: boolean }[]
  }) {
    if (editingTodo) {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          progress: data.progress,
          eventId: data.eventId,
          eventCalendarId: data.eventCalendarId,
          eventSummary: data.eventSummary,
        }),
      })
      if (!res.ok) return

      const newSubIds = new Set(
        data.subTodos.filter((s) => s.id).map((s) => s.id!)
      )

      // Delete removed sub-todos
      for (const sub of editingTodo.subTodos) {
        if (!newSubIds.has(sub.id)) {
          await fetch(`/api/todos/${sub.id}`, { method: "DELETE" })
        }
      }

      // Create / update sub-todos
      for (const sub of data.subTodos) {
        if (!sub.id) {
          await fetch("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: sub.title,
              completed: sub.completed,
              parentId: editingTodo.id,
            }),
          })
        } else {
          const existing = editingTodo.subTodos.find((s) => s.id === sub.id)
          if (existing && existing.completed !== sub.completed) {
            await fetch(`/api/todos/${sub.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ completed: sub.completed }),
            })
          }
        }
      }

      await fetchTodos()
      setEditingTodo(null)
    } else {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          progress: data.progress,
          eventId: data.eventId,
          eventCalendarId: data.eventCalendarId,
          eventSummary: data.eventSummary,
        }),
      })
      if (!res.ok) return
      const created: Todo = await res.json()

      for (const sub of data.subTodos) {
        await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: sub.title,
            completed: sub.completed,
            parentId: created.id,
          }),
        })
      }

      await fetchTodos()
    }
  }

  /**
   * Toggle a top-level todo. If it has sub-todos, propagate the completed
   * state down to all of them (checking parent checks all; unchecking unchecks all).
   */
  async function handleToggle(id: string, completed: boolean) {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    // Optimistic update — parent + all sub-todos
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          completed,
          subTodos: t.subTodos.map((s) => ({ ...s, completed })),
        }
      })
    )

    // Persist parent
    await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })

    // Propagate to sub-todos
    if (todo.subTodos.length > 0) {
      await Promise.all(
        todo.subTodos.map((sub) =>
          fetch(`/api/todos/${sub.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed }),
          })
        )
      )
    }
  }

  async function handleToggleSubTodo(
    parentId: string,
    subId: string,
    completed: boolean
  ) {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== parentId) return t
        const updatedSubs = t.subTodos.map((s) =>
          s.id === subId ? { ...s, completed } : s
        )
        const allDone = updatedSubs.every((s) => s.completed)
        return { ...t, subTodos: updatedSubs, completed: allDone }
      })
    )

    await fetch(`/api/todos/${subId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })

    // Sync parent state
    const parent = todos.find((t) => t.id === parentId)
    if (parent) {
      const updatedSubs = parent.subTodos.map((s) =>
        s.id === subId ? { ...s, completed } : s
      )
      const allDone = updatedSubs.every((s) => s.completed)
      if (allDone !== parent.completed) {
        await fetch(`/api/todos/${parentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: allDone }),
        })
      }
    }
  }

  async function handleInlineSave(data: {
    title: string
    description: string | null
    dueDate: string | null
    subTodos: { title: string; completed: boolean }[]
  }) {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        progress: null,
        eventId: null,
        eventCalendarId: null,
        eventSummary: null,
      }),
    })
    if (!res.ok) throw new Error("Failed to save")
    const created: Todo = await res.json()

    for (const sub of data.subTodos) {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sub.title,
          completed: sub.completed,
          parentId: created.id,
        }),
      })
    }

    await fetchTodos()
  }

  function handleEdit(todo: Todo) {
    setEditingTodo(todo)
  }

  async function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/todos/${id}`, { method: "DELETE" })
  }

  // ── Shared item renderer ────────────────────────────────────────────────────

  function renderItem(todo: Todo, isOverdueItem = false) {
    if (editingTodo?.id === todo.id) {
      return (
        <InlineEditTodo
          key={todo.id}
          todo={todo}
          onSave={handleSave}
          onCancel={() => setEditingTodo(null)}
        />
      )
    }
    return (
      <TodoItem
        key={todo.id}
        todo={todo}
        isOverdue={isOverdueItem}
        onToggle={handleToggle}
        onToggleSubTodo={handleToggleSubTodo}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="To-do" subtitle="Track your daily tasks" />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            {/* Completed Cards — overdue todos that got checked off (collapsed by default) */}
            {completedOverdue.length > 0 && (
              <TodoSection
                variant="completed"
                activeCount={completedOverdue.length}
              >
                <div className="flex flex-col gap-6">
                  {groupByWeek(completedOverdue).map((group) => (
                    <div key={group.key} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {group.todos.map((t) => renderItem(t))}
                      </div>
                    </div>
                  ))}
                </div>
              </TodoSection>
            )}

            {/* Overdue — uncompleted only */}
            {overdueActive.length > 0 && (
              <TodoSection
                variant="overdue"
                activeCount={overdueActive.length}
              >
                {overdueActive.map((t) => renderItem(t, true))}
              </TodoSection>
            )}

            {/* Current window — all todos (active + completed) always visible */}
            <TodoSection
              variant="current"
              dateWindow={dateWindow}
              onDateWindowChange={setDateWindow}
              sortOption={sortOption}
              onSortChange={setSortOption}
              activeCount={currentActive.length + currentCompleted.length}
              footer={<InlineAddTodo onSave={handleInlineSave} />}
            >
              {sortTodos(currentActive, sortOption).map((t) => renderItem(t))}
              {sortTodos(currentCompleted, sortOption).map((t) => renderItem(t))}
            </TodoSection>

            {/* Upcoming — future todos, collapsed by default */}
            {futureAll.length > 0 && (
              <TodoSection variant="future" activeCount={futureAll.length}>
                <div className="flex flex-col gap-6">
                  {groupByWeek(futureAll, "asc").map((group) => (
                    <div key={group.key} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {group.todos.map((t) => renderItem(t))}
                      </div>
                    </div>
                  ))}
                </div>
              </TodoSection>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
