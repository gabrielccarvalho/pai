"use client"

import Link from "next/link"
import {
  format,
  parseISO,
  isBefore,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Tick02Icon } from "../../components/icons"
import type { Todo } from "../../lib/types"

function ProgressRing({ rate, size = 76 }: { rate: number; size?: number }) {
  const r = 28
  const circumference = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        className="text-muted"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - rate / 100)}
        strokeLinecap="round"
        className="text-primary transition-all duration-500"
      />
    </svg>
  )
}

function getTodoProgress(todo: Todo): number | null {
  if (todo.subTodos.length === 0) return null
  if (todo.progress !== null) return todo.progress
  return Math.round(
    (todo.subTodos.filter((s) => s.completed).length / todo.subTodos.length) *
      100
  )
}

export function TodoWidget({
  todos,
  loading,
  now,
}: {
  todos: Todo[]
  loading: boolean
  now: Date
}) {
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
  const completedRecent = rootTodos
    .filter((t) => t.completed)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

  const completedCount = rootTodos.filter((t) => t.completed).length
  const completionRate =
    rootTodos.length > 0
      ? Math.round((completedCount / rootTodos.length) * 100)
      : 0

  // Priority order: overdue → due today → recently completed
  const highlighted = [
    ...overdueTodos,
    ...dueTodayTodos,
    ...completedRecent,
  ].slice(0, 3)
  const allClear = overdueTodos.length === 0 && dueTodayTodos.length === 0

  return (
    <Card
      className="flex flex-col border-border/60"
      style={{ height: "320px" }}
    >
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="text-sm font-semibold">To-dos</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
        {loading ? (
          <div className="flex-1 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {/* Progress ring + stats */}
            <div className="mb-3 flex shrink-0 items-center gap-4">
              <div className="relative shrink-0">
                <ProgressRing rate={completionRate} />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {completionRate}%
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {rootTodos.length} completed
                </p>
                <div className="flex flex-wrap gap-2">
                  {overdueTodos.length > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {overdueTodos.length} overdue
                    </span>
                  )}
                  {dueTodayTodos.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {dueTodayTodos.length} due today
                    </span>
                  )}
                  {allClear && rootTodos.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      All caught up
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Todo list */}
            <div className="min-h-0 flex-1">
              {rootTodos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">No todos yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {highlighted.map((todo) => {
                    const isOverdue =
                      !todo.completed &&
                      todo.dueDate &&
                      isBefore(parseISO(todo.dueDate), today)
                    const progress = getTodoProgress(todo)

                    return (
                      <Link
                        key={todo.id}
                        href="/todo"
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                      >
                        {/* Status indicator */}
                        {todo.completed ? (
                          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary">
                            <Tick02Icon
                              className="size-2.5 text-primary-foreground"
                              strokeWidth={2.5}
                            />
                          </div>
                        ) : (
                          <div
                            className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                              isOverdue
                                ? "border-destructive"
                                : "border-primary"
                            }`}
                          />
                        )}

                        {/* Title + progress */}
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          <p
                            className={`truncate text-sm ${
                              todo.completed
                                ? "text-muted-foreground line-through"
                                : isOverdue
                                  ? "text-destructive"
                                  : ""
                            }`}
                          >
                            {todo.title}
                          </p>
                          {progress !== null && (
                            <span className="shrink-0 text-xs font-medium text-primary tabular-nums">
                              {progress}% completed
                            </span>
                          )}
                        </div>

                        {/* Due date */}
                        {todo.dueDate && !todo.completed && (
                          <span
                            className={`shrink-0 text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {format(parseISO(todo.dueDate), "MMM d")}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end pt-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary"
              >
                <Link href="/todo">See all to-dos →</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
