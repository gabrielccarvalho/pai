"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { Clock01Icon } from "../../components/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns"
import type { DateRange } from "react-day-picker"
import type { TaskBoard, Column, Task } from "../../lib/types"

// ─── helpers ───────────────────────────────────────────────────────────────

function formatHours(value: number): string {
  const h = Math.floor(value)
  const m = Math.round((value - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getTaskTitle(task: Task, columns: Column[]): string {
  const textCol = columns.find((c) => c.type === "text")
  if (!textCol) return "Untitled task"
  const val = task.values[textCol.id]
  return typeof val === "string" && val.trim() ? val : "Untitled task"
}

function getTaskHours(task: Task, hoursColId: string): number {
  const val = task.values[hoursColId]
  if (typeof val === "number") return val
  return 0
}

function formatRangeLabel(range: DateRange): string {
  if (!range.from) return "Pick a range"
  if (!range.to || range.from.toDateString() === range.to.toDateString()) {
    return format(range.from, "MMM d, yyyy")
  }
  if (range.from.getFullYear() === range.to.getFullYear()) {
    return `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
  }
  return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
}

// ─── badge helpers ──────────────────────────────────────────────────────────

const BADGE_COLUMN_NAMES = ["priority", "status", "project"]

function findBadgeColumns(columns: Column[], companyColId: string): Column[] {
  const byName = BADGE_COLUMN_NAMES.map((name) =>
    columns.find(
      (c) =>
        c.id !== companyColId &&
        (c.type === "select" || c.type === "multiselect") &&
        c.name.toLowerCase().includes(name)
    )
  ).filter(Boolean) as Column[]

  const seen = new Set(byName.map((c) => c.id))
  const others = columns.filter(
    (c) =>
      !seen.has(c.id) &&
      c.id !== companyColId &&
      (c.type === "select" || c.type === "multiselect")
  )
  return [...byName, ...others].slice(0, 3)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null
}

function TaskBadges({ task, badgeCols }: { task: Task; badgeCols: Column[] }) {
  const badges: { label: string; color: string | null }[] = []

  for (const col of badgeCols) {
    const val = task.values[col.id]
    if (!val) continue
    const ids = Array.isArray(val) ? val.map(String) : [String(val)]
    for (const id of ids) {
      const opt = col.options.find((o) => o.id === id)
      if (opt) badges.push({ label: opt.label, color: opt.color })
    }
  }

  if (badges.length === 0) return null

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      {badges.map((b, i) => {
        const rgb = b.color ? hexToRgb(b.color) : null
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-muted-foreground/40 text-xs select-none">•</span>
            )}
            <span
              className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-medium"
              style={
                rgb
                  ? {
                      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
                      color: b.color!,
                    }
                  : {
                      backgroundColor: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                    }
              }
            >
              {b.label}
            </span>
          </span>
        )
      })}
    </div>
  )
}

// ─── main component ─────────────────────────────────────────────────────────

function defaultRange(): DateRange {
  const today = new Date()
  return {
    from: startOfWeek(today, { weekStartsOn: 1 }),
    to: endOfWeek(today, { weekStartsOn: 1 }),
  }
}

export function HoursChartWidget({ board }: { board: TaskBoard }) {
  const [range, setRange] = useState<DateRange>(defaultRange)
  const [calOpen, setCalOpen] = useState(false)
  const [activeCompany, setActiveCompany] = useState<string | null>(null)

  // Column detection
  const companyColumn = useMemo(
    () => board.columns.find((c) => c.type === "select" || c.type === "multiselect"),
    [board.columns]
  ) as Column | undefined

  const hoursColumn = useMemo(
    () => board.columns.find((c) => c.type === "number_hour"),
    [board.columns]
  ) as Column | undefined

  const dateColumn = useMemo(
    () => board.columns.find((c) => c.type === "date"),
    [board.columns]
  ) as Column | undefined

  const badgeColumns = useMemo(
    () => (companyColumn ? findBadgeColumns(board.columns, companyColumn.id) : []),
    [board.columns, companyColumn]
  )

  // Filter tasks to the selected range
  const rangeStart = range.from ? startOfDay(range.from) : null
  const rangeEnd = range.to ? endOfDay(range.to) : range.from ? endOfDay(range.from) : null

  const weekTasks = useMemo(() => {
    if (!rangeStart || !rangeEnd) return board.tasks
    return board.tasks.filter((task) => {
      let taskDate: Date | null = null
      if (dateColumn) {
        const val = task.values[dateColumn.id]
        if (typeof val === "string" && val) {
          try { taskDate = parseISO(val) } catch { taskDate = null }
        }
      }
      if (!taskDate) taskDate = new Date(task.updatedAt)
      return isWithinInterval(taskDate, { start: rangeStart, end: rangeEnd })
    })
  }, [board.tasks, dateColumn, rangeStart, rangeEnd])

  // Chart data: hours per company option for the range
  const chartData = useMemo(() => {
    if (!companyColumn || !hoursColumn) return []
    const totals: Record<string, number> = {}
    for (const option of companyColumn.options) totals[option.id] = 0

    for (const task of weekTasks) {
      const companyVal = task.values[companyColumn.id]
      const hours = getTaskHours(task, hoursColumn.id)
      if (!companyVal || hours === 0) continue
      const ids = Array.isArray(companyVal) ? companyVal.map(String) : [String(companyVal)]
      for (const id of ids) {
        if (id in totals) totals[id] = (totals[id] ?? 0) + hours
      }
    }

    return companyColumn.options
      .sort((a, b) => a.order - b.order)
      .map((option) => ({
        id: option.id,
        name: option.label,
        hours: Math.round((totals[option.id] ?? 0) * 10) / 10,
        color: option.color ?? "#94a3b8",
      }))
  }, [companyColumn, hoursColumn, weekTasks])

  // Auto-select first company with hours (or first)
  const defaultCompany = useMemo(() => {
    if (!companyColumn) return null
    return (chartData.find((d) => d.hours > 0) ?? chartData[0])?.id ?? null
  }, [chartData, companyColumn])

  const resolvedActive = activeCompany ?? defaultCompany

  const activeTasks = useMemo(() => {
    if (!resolvedActive || !companyColumn) return []
    return weekTasks
      .filter((task) => {
        const val = task.values[companyColumn.id]
        if (!val) return false
        const ids = Array.isArray(val) ? val.map(String) : [String(val)]
        return ids.includes(resolvedActive)
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
  }, [resolvedActive, companyColumn, weekTasks])

  const maxHours = Math.max(...chartData.map((d) => d.hours), 0)
  const yMax = Math.max(40, Math.ceil(maxHours / 10) * 10)
  const chartConfig: ChartConfig = { hours: { label: "Hours" } }
  const activeOption = companyColumn?.options.find((o) => o.id === resolvedActive)

  if (!companyColumn || !hoursColumn) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Working Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Add a <span className="font-medium">select</span> column and a{" "}
              <span className="font-medium">hours</span> column to your task board to see this chart.
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-3 text-xs text-primary">
              <Link href="/tasks">Go to Tasks →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold">Working Hours</CardTitle>

          {/* Date range picker */}
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-border/60 px-2.5 text-xs font-normal text-muted-foreground"
              >
                <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" strokeWidth={2} />
                {formatRangeLabel(range)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(_r, selectedDay) => {
                  const from = startOfWeek(selectedDay, { weekStartsOn: 1 })
                  const to = endOfWeek(selectedDay, { weekStartsOn: 1 })
                  setRange({ from, to })
                  setActiveCompany(null)
                  setCalOpen(false)
                }}
                weekStartsOn={1}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            onClick={(data) => {
              if (data?.activePayload?.[0]) {
                const clickedId = (data.activePayload[0].payload as { id: string }).id
                setActiveCompany((prev) => (prev === clickedId ? null : clickedId))
              }
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}h`}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const item = payload[0]!
                const color = (item.payload as { color: string }).color
                const label = (item.payload as { name: string }).name
                const hours = item.value as number
                return (
                  <div className="grid min-w-28 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock01Icon className="size-3 shrink-0" strokeWidth={2} />
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatHours(hours)}
                      </span>
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} cursor="pointer" maxBarSize={48}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.color}
                  opacity={resolvedActive && resolvedActive !== entry.id ? 0.35 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Expanded tasks panel — fixed height always */}
        {resolvedActive && (
          <div className="mt-4 rounded-lg border border-border/60 p-3" style={{ height: "152px" }}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Recent tasks — {activeOption?.label}
            </p>
            {activeTasks.length === 0 ? (
              <div className="flex h-[96px] items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  No tasks in this range for {activeOption?.label}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {activeTasks.map((task) => {
                  const hours = getTaskHours(task, hoursColumn.id)
                  const title = getTaskTitle(task, board.columns)
                  return (
                    <div
                      key={task.id}
                      className="flex h-8 items-center justify-between gap-3 rounded-md px-2 hover:bg-muted/50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <p className="truncate text-sm">{title}</p>
                        <TaskBadges task={task} badgeCols={badgeColumns} />
                      </div>
                      {hours > 0 && (
                        <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                          {formatHours(hours)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary">
            <Link href="/tasks">Go to Tasks →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
