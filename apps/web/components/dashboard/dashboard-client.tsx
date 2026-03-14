"use client"

import { useState, useEffect, useCallback } from "react"
import {
  format,
  startOfDay,
  endOfDay,
  parseISO,
  isBefore,
  isWithinInterval,
} from "date-fns"
import { ScheduleWidget } from "./schedule-widget"
import { TodoWidget } from "./todo-widget"
import { HoursChartWidget } from "./hours-chart-widget"
import { QuickNav } from "./quick-nav"
import type { TaskBoard, Todo, CalendarEvent } from "../../lib/types"

function getGreeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

interface DashboardClientProps {
  initialBoard: TaskBoard
  userName: string
}

export function DashboardClient({
  initialBoard,
  userName,
}: DashboardClientProps) {
  const [now, setNow] = useState(() => new Date())
  const [todos, setTodos] = useState<Todo[]>([])
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [todosLoading, setTodosLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [calendarAuthError, setCalendarAuthError] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todos")
      if (!res.ok) return
      const data = await res.json()
      setTodos(data)
    } finally {
      setTodosLoading(false)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const today = new Date()
      const timeMin = startOfDay(today).toISOString()
      const timeMax = endOfDay(today).toISOString()
      const url = `/api/schedule/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&calendarIds=primary`
      const res = await fetch(url)
      if (res.status === 401) {
        setCalendarAuthError(true)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      setTodayEvents(data)
    } finally {
      setEventsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
    fetchEvents()
  }, [fetchTodos, fetchEvents])

  const today = startOfDay(now)
  const endToday = endOfDay(now)
  const rootTodos = todos.filter((t) => !t.parentId)
  const overdueTodos = rootTodos.filter(
    (t) => !t.completed && t.dueDate && isBefore(parseISO(t.dueDate), today)
  )
  const dueTodayTodos = rootTodos.filter(
    (t) =>
      !t.completed &&
      t.dueDate &&
      isWithinInterval(parseISO(t.dueDate), { start: today, end: endToday })
  )

  const firstName = userName.split(" ")[0] ?? userName
  const greeting = getGreeting(now)

  return (
    <div className="flex flex-col gap-6 p-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {format(now, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Schedule + Todos row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ScheduleWidget
          events={todayEvents}
          loading={eventsLoading}
          authError={calendarAuthError}
          now={now}
        />
        <TodoWidget todos={todos} loading={todosLoading} now={now} />
      </div>

      {/* Hours chart + Quick nav row */}
      <div className="grid grid-cols-1 gap-4">
        <HoursChartWidget board={initialBoard} />
      </div>
    </div>
  )
}
