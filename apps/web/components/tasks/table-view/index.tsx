'use client'

import { useState } from 'react'
import { Add01Icon } from '@/components/icons'
import { ColumnHeader } from './column-header'
import { TaskRow } from './task-row'
import { AddTaskRow } from './add-task-row'
import { AddColumnDialog } from './add-column-dialog'
import type { Column, ColumnType, Task, TaskBoard } from '../../../lib/types'

const DEFAULT_COL_WIDTH = 180
const TITLE_COL_WIDTH = 280

interface TableViewProps {
  board: TaskBoard
  onAddTask: () => Promise<void>
  onUpdateTask: (taskId: string, values: Record<string, unknown>) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onAddColumn: (name: string, type: ColumnType) => Promise<void>
  onRenameColumn: (columnId: string, name: string) => Promise<void>
  onDeleteColumn: (columnId: string) => Promise<void>
  onCreateOption: (columnId: string, label: string) => Promise<void>
}

export function TableView({
  board,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onCreateOption,
}: TableViewProps) {
  const [addColOpen, setAddColOpen] = useState(false)

  const colWidths: Record<string, number> = {}
  board.columns.forEach((col) => {
    colWidths[col.id] = col.name.toLowerCase() === 'title' || col.type === 'text' && col.order === 1
      ? TITLE_COL_WIDTH
      : DEFAULT_COL_WIDTH
  })

  const totalWidth =
    32 + // row action
    board.columns.reduce((sum, col) => sum + (colWidths[col.id] ?? DEFAULT_COL_WIDTH), 0)

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth }}>
        {/* Header row */}
        <div className="flex items-stretch border-b border-border bg-muted/30">
          <div className="w-8 shrink-0" />
          {board.columns.map((col) => (
            <div
              key={col.id}
              className="group shrink-0 border-l border-border"
              style={{ width: colWidths[col.id] ?? DEFAULT_COL_WIDTH }}
            >
              <ColumnHeader
                column={col}
                onRename={(name) => onRenameColumn(col.id, name)}
                onDelete={() => onDeleteColumn(col.id)}
              />
            </div>
          ))}
          {/* Add column button */}
          <div className="flex items-center border-l border-border px-2">
            <button
              className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setAddColOpen(true)}
            >
              <Add01Icon className="h-3.5 w-3.5" />
              Add column
            </button>
          </div>
        </div>

        {/* Task rows */}
        <div>
          {board.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              columns={board.columns}
              colWidths={colWidths}
              onUpdateValues={(values) => onUpdateTask(task.id, values)}
              onCreateOption={onCreateOption}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>

        <AddTaskRow onAdd={onAddTask} />
      </div>

      <AddColumnDialog
        open={addColOpen}
        onOpenChange={setAddColOpen}
        onAdd={onAddColumn}
      />
    </div>
  )
}
