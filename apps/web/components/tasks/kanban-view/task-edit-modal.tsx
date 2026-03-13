'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Cell } from '../table-view/cell'
import type { Column, Task } from '../../../lib/types'

interface TaskEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  columns: Column[]
  onUpdateTask: (taskId: string, values: Record<string, unknown>) => Promise<void>
  onCreateOption: (columnId: string, label: string) => Promise<void>
  onUpdateOption: (optionId: string, color: string | null) => Promise<void>
}

export function TaskEditModal({
  open,
  onOpenChange,
  task,
  columns,
  onUpdateTask,
  onCreateOption,
  onUpdateOption,
}: TaskEditModalProps) {
  const titleCol = columns.find(
    (c) => c.name.toLowerCase() === 'title' || (c.type === 'text' && c.order === 1)
  )
  const otherCols = columns.filter((c) => c.id !== titleCol?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Task</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          {/* Title field — full width, prominent */}
          {titleCol && (
            <div className="rounded-md border border-border">
              <Cell
                column={titleCol}
                task={task}
                onUpdate={(values) => onUpdateTask(task.id, values)}
                onCreateOption={onCreateOption}
                onUpdateOption={onUpdateOption}
                multiline
              />
            </div>
          )}

          {/* Other fields — label + value rows */}
          {otherCols.map((col) => (
            <div
              key={col.id}
              className="grid grid-cols-[140px_1fr] items-center rounded-md hover:bg-muted/40"
            >
              <span className="px-3 text-xs font-medium text-muted-foreground">
                {col.name}
              </span>
              <div className="min-w-0 rounded-md border border-transparent hover:border-border">
                <Cell
                  column={col}
                  task={task}
                  onUpdate={(values) => onUpdateTask(task.id, values)}
                  onCreateOption={onCreateOption}
                  onUpdateOption={onUpdateOption}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
