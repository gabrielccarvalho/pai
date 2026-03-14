"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Sorting01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export type DateWindow = "today" | "this-week"
export type SortOption = "due-asc" | "due-desc" | "completion"

interface TodoSectionProps {
  variant: "overdue" | "current" | "completed" | "future"
  dateWindow?: DateWindow
  onDateWindowChange?: (w: DateWindow) => void
  sortOption?: SortOption
  onSortChange?: (s: SortOption) => void
  children: React.ReactNode
  /** Count badge shown next to the header */
  activeCount?: number
  /** Empty state — only used by the "current" variant */
  emptyState?: React.ReactNode
  /** Always rendered after items, even when empty (used for inline add) */
  footer?: React.ReactNode
}

const WINDOW_LABELS: Record<DateWindow, string> = {
  today: "Today",
  "this-week": "This Week",
}

const SORT_LABELS: Record<SortOption, string> = {
  "due-asc": "Due date (oldest first)",
  "due-desc": "Due date (newest first)",
  completion: "Completion %",
}

export function TodoSection({
  variant,
  dateWindow,
  onDateWindowChange,
  sortOption,
  onSortChange,
  children,
  activeCount = 0,
  emptyState,
  footer,
}: TodoSectionProps) {
  const [collapsed, setCollapsed] = useState(
    variant === "completed" || variant === "future"
  )
  const isEmpty = activeCount === 0

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        {variant === "overdue" && (
          <h2 className="text-base font-semibold text-destructive">Overdue</h2>
        )}

        {(variant === "completed" || variant === "future") && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-accent transition-colors"
          >
            <h2 className="text-base font-semibold text-muted-foreground">
              {variant === "completed" ? "Completed" : "Upcoming"}
            </h2>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                collapsed && "-rotate-90"
              )}
              strokeWidth={2}
            />
          </button>
        )}

        {variant === "current" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-base font-semibold hover:bg-accent transition-colors"
              >
                {dateWindow ? WINDOW_LABELS[dateWindow] : "Today"}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className="size-4 text-muted-foreground"
                  strokeWidth={2}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => onDateWindowChange?.("today")}
                className={cn(dateWindow === "today" && "font-semibold")}
              >
                Today
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDateWindowChange?.("this-week")}
                className={cn(dateWindow === "this-week" && "font-semibold")}
              >
                This Week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {activeCount > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {activeCount}
          </span>
        )}

        {variant === "current" && onSortChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent",
                  sortOption ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <HugeiconsIcon
                  icon={Sorting01Icon}
                  className="size-3.5"
                  strokeWidth={2}
                />
                {sortOption ? SORT_LABELS[sortOption] : "Sort"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {(["due-asc", "due-desc", "completion"] as SortOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => onSortChange(opt)}
                  className={cn(sortOption === opt && "font-semibold")}
                >
                  {SORT_LABELS[opt]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && emptyState}

      {/* Items */}
      {!isEmpty && !collapsed && (
        <div className="flex flex-col gap-2">{children}</div>
      )}

      {/* Footer — always rendered (e.g. inline add button) */}
      {footer}
    </div>
  )
}
