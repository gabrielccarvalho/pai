"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import type { TaskBoard, Column, ColumnOption } from "../../lib/types"

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null
}

interface TasksWidgetProps {
  board: TaskBoard
}

export function TasksWidget({ board }: TasksWidgetProps) {
  const statusColumn = board.columns.find(
    (col) => col.type === "select" || col.type === "multiselect"
  ) as Column | undefined

  const totalTasks = board.tasks.length

  // Count tasks per option
  const optionCounts: Record<string, number> = {}
  let uncategorized = 0

  if (statusColumn) {
    for (const task of board.tasks) {
      const val = task.values[statusColumn.id]
      if (!val) {
        uncategorized++
        continue
      }
      // For multiselect, val may be an array
      const ids = Array.isArray(val) ? val : [val]
      if (ids.length === 0) {
        uncategorized++
      } else {
        for (const id of ids) {
          const key = String(id)
          optionCounts[key] = (optionCounts[key] ?? 0) + 1
        }
      }
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
          <Link
            href="/tasks"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums">{totalTasks}</span>
          <span className="text-sm text-muted-foreground">tasks in {board.name}</span>
        </div>

        {statusColumn && statusColumn.options.length > 0 ? (
          <div className="space-y-2">
            {statusColumn.options
              .sort((a, b) => a.order - b.order)
              .map((option: ColumnOption) => {
                const count = optionCounts[option.id] ?? 0
                const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0
                const rgb = option.color ? hexToRgb(option.color) : null

                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: option.color ?? "#94a3b8",
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{option.label}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: rgb
                            ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`
                            : "#94a3b8",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            {uncategorized > 0 && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground">Uncategorized</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {uncategorized}
                </span>
              </div>
            )}
          </div>
        ) : totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
            <Link href="/tasks" className="mt-1 text-xs text-primary hover:underline">
              Create your first →
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {board.columns.length} columns configured
          </p>
        )}
      </CardContent>
    </Card>
  )
}
