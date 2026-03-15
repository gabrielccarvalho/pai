"use client"

import { useRef } from "react"
import confetti from "canvas-confetti"
import { format, parseISO } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tick02Icon,
  Delete01Icon,
  PencilEdit01Icon,
  MoreVerticalIcon,
  Calendar01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import type { Todo } from "../../lib/types"

interface TodoItemProps {
  todo: Todo
  isOverdue?: boolean
  onToggle: (id: string, completed: boolean) => void
  onToggleSubTodo: (parentId: string, subId: string, completed: boolean) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

export function TodoItem({
  todo,
  isOverdue = false,
  onToggle,
  onToggleSubTodo,
  onEdit,
  onDelete,
}: TodoItemProps) {
  const hasSubTodos = todo.subTodos.length > 0
  const completedSubs = todo.subTodos.filter((s) => s.completed).length
  const totalSubs = todo.subTodos.length

  const progressValue = hasSubTodos
    ? Math.round((completedSubs / totalSubs) * 100)
    : todo.progress

  // Always show the bar when there are sub-tasks, even at 0%
  const showProgress =
    hasSubTodos || (progressValue != null && progressValue > 0)

  const isCompleted = hasSubTodos ? completedSubs === totalSubs : todo.completed

  const dateLabel = todo.dueDate
    ? format(parseISO(todo.dueDate), "MMM d")
    : null

  const checkboxRef = useRef<HTMLDivElement>(null)

  function fireConfetti() {
    if (!checkboxRef.current) return
    const rect = checkboxRef.current.getBoundingClientRect()
    confetti({
      particleCount: 60,
      spread: 70,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      startVelocity: 20,
      gravity: 1.2,
      scalar: 0.8,
    })
  }

  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card px-4 py-3 transition-opacity",
        isCompleted && "opacity-60"
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div ref={checkboxRef} className="mt-0.5 size-5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!isCompleted) fireConfetti()
              onToggle(todo.id, !isCompleted)
            }}
            className={cn(
              "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
              isCompleted
                ? "border-primary bg-primary"
                : "border-muted-foreground/50 hover:border-primary"
            )}
          >
            {isCompleted && (
              <HugeiconsIcon
                icon={Tick02Icon}
                className="size-3 text-primary-foreground"
                strokeWidth={3}
              />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "leading-tight font-medium",
              isCompleted && "text-muted-foreground line-through"
            )}
          >
            {todo.title}
          </span>

          {/* Description */}
          {todo.description && (
            <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
              {todo.description}
            </p>
          )}

          {/* Sub-todos — always visible */}
          {hasSubTodos && (
            <div className="mt-2 flex flex-col gap-1">
              {todo.subTodos.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      const completing = !sub.completed
                      const willFinishAll =
                        completing &&
                        todo.subTodos.filter(
                          (s) => s.id !== sub.id && !s.completed
                        ).length === 0
                      if (willFinishAll) {
                        const btn = e.currentTarget
                        const rect = btn.getBoundingClientRect()
                        confetti({
                          particleCount: 60,
                          spread: 70,
                          origin: {
                            x: (rect.left + rect.width / 2) / window.innerWidth,
                            y:
                              (rect.top + rect.height / 2) / window.innerHeight,
                          },
                          startVelocity: 20,
                          gravity: 1.2,
                          scalar: 0.8,
                        })
                      }
                      onToggleSubTodo(todo.id, sub.id, completing)
                    }}
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      sub.completed
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/50 hover:border-primary"
                    )}
                  >
                    {sub.completed && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className="size-2.5 text-primary-foreground"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      sub.completed && "text-muted-foreground line-through"
                    )}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={Calendar01Icon}
              className="size-3"
              strokeWidth={2}
            />
            {dateLabel && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {isOverdue ? `Overdue · ${dateLabel}` : dateLabel}
              </span>
            )}

            {todo.eventSummary && (
              <>
                {dateLabel && (
                  <span className="text-xs text-muted-foreground">·</span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <HugeiconsIcon
                    icon={UserMultipleIcon}
                    className="size-3"
                    strokeWidth={2}
                  />
                  {todo.eventSummary}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-accent hover:text-foreground focus:opacity-100"
              >
                <HugeiconsIcon
                  icon={MoreVerticalIcon}
                  className="size-4"
                  strokeWidth={2}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(todo)}>
                <HugeiconsIcon
                  icon={PencilEdit01Icon}
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(todo.id)}
                className="text-destructive focus:text-destructive"
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="mt-3 pr-8 pl-8">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${progressValue}%`,
                transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {progressValue}%
          </div>
        </div>
      )}
    </div>
  )
}
