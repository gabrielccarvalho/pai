"use client"

import React, { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { format, parseISO } from "date-fns"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Delete01Icon,
  LinkForwardIcon,
  MoreVerticalIcon,
  PencilEdit01Icon,
} from "@/components/icons"
import { cn } from "@workspace/ui/lib/utils"
import { TaskEditModal } from "./task-edit-modal"
import {
  getColumnOption,
  getTitleValue,
  optionBadgeStyle,
  priorityBadgeStyle,
} from "../../../lib/task-utils"
import type { Column, Task } from "../../../lib/types"

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#22c55e",
}

interface KanbanCardProps {
  task: Task
  columns: Column[]
  onDelete: () => void
  onUpdateTask?: (
    taskId: string,
    values: Record<string, unknown>
  ) => Promise<void>
  onCreateOption?: (columnId: string, label: string) => Promise<void>
  onUpdateOption?: (optionId: string, color: string | null) => Promise<void>
  isDragging?: boolean
  isDragOverlay?: boolean
}

export function KanbanCard({
  task,
  columns,
  onDelete,
  onUpdateTask,
  onCreateOption,
  onUpdateOption,
  isDragging,
  isDragOverlay,
}: KanbanCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  const style = isDragOverlay
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const title = getTitleValue(task, columns)

  const priorityCol = columns.find((c) => c.name.toLowerCase() === "priority")
  const priorityOpt = getColumnOption(
    columns,
    "priority",
    priorityCol ? task.values[priorityCol.id] : null
  )

  const companyCol = columns.find((c) => c.name.toLowerCase() === "company")
  const companyRaw = companyCol ? task.values[companyCol.id] : null
  const companyOpt = companyCol
    ? getColumnOption(columns, "company", companyRaw)
    : null

  const dueDateCol = columns.find(
    (c) => c.name.toLowerCase() === "due date" || c.type === "date"
  )
  const dueDate = dueDateCol ? (task.values[dueDateCol.id] as string) : null

  const priorityColor = priorityOpt
    ? (PRIORITY_COLORS[priorityOpt.label.toLowerCase()] ?? priorityOpt.color)
    : null

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (!isDragOverlay) setEditOpen(true)
        }}
        className={cn(
          "group relative cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing",
          isDragging && "opacity-30",
          isDragOverlay && "rotate-1 shadow-lg",
          !isDragging && !isDragOverlay && "hover:shadow-md"
        )}
      >
        {/* Three-dot menu */}
        <div
          className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVerticalIcon className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="gap-2 whitespace-nowrap text-muted-foreground"
                onSelect={() => setEditOpen(true)}
              >
                <PencilEdit01Icon className="h-3.5 w-3.5 shrink-0" />
                Edit task
              </DropdownMenuItem>
              {columns
                .filter((c) => c.type === "url" && task.values[c.id])
                .map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    className="gap-2 whitespace-nowrap text-muted-foreground"
                    onSelect={() =>
                      window.open(
                        task.values[c.id] as string,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    <LinkForwardIcon className="h-3.5 w-3.5 shrink-0" />
                    {c.name}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem
                className="gap-2 whitespace-nowrap text-destructive focus:text-destructive"
                onSelect={onDelete}
              >
                <Delete01Icon className="h-3.5 w-3.5 shrink-0" />
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {companyOpt && (
          <div className="mb-1.5">
            <Badge
              variant="secondary"
              className="text-xs"
              style={optionBadgeStyle(companyOpt.color)}
            >
              {companyOpt.label}
            </Badge>
          </div>
        )}

        <p className="pr-6 text-sm leading-snug font-medium">{title}</p>

        {(priorityOpt || dueDate) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {priorityOpt && (
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={priorityBadgeStyle(priorityColor)}
              >
                {priorityOpt.label}
              </Badge>
            )}
            {dueDate && (
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(dueDate), "MMM d")}
              </span>
            )}
          </div>
        )}
      </div>

      {onUpdateTask && (
        <TaskEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          task={task}
          columns={columns}
          onUpdateTask={onUpdateTask}
          onCreateOption={onCreateOption ?? (async () => {})}
          onUpdateOption={onUpdateOption ?? (async () => {})}
        />
      )}
    </>
  )
}
