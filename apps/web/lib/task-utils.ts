import type React from 'react'
import type { Column, ColumnOption, Task } from './types'

// ── Column finders ────────────────────────────────────────────────────────────

export function getStatusColumn(columns: Column[]): Column | undefined {
  return (
    columns.find((c) => c.name.toLowerCase() === 'status' && c.type === 'select') ??
    columns.find((c) => c.type === 'select')
  )
}

export function getTitleColumn(columns: Column[]): Column | undefined {
  return (
    columns.find((c) => c.name.toLowerCase() === 'title') ??
    columns.find((c) => c.type === 'text')
  )
}

// ── Option helpers ────────────────────────────────────────────────────────────

export function getDoneOption(statusCol: Column | undefined): ColumnOption | undefined {
  return statusCol?.options.find((o) => o.label.toLowerCase() === 'done')
}

/** Resolve an option by value (ID) within a named column. */
export function getColumnOption(
  columns: Column[],
  columnName: string,
  value: unknown,
): ColumnOption | null {
  const col = columns.find((c) => c.name.toLowerCase() === columnName.toLowerCase())
  if (!col || !value) return null
  return col.options.find((o) => o.id === value) ?? null
}

// ── Task helpers ──────────────────────────────────────────────────────────────

export function getTitleValue(task: Task, columns: Column[]): string {
  const col = getTitleColumn(columns)
  if (!col) return 'Untitled'
  return (task.values[col.id] as string) || 'Untitled'
}

export function isTaskDone(task: Task, columns: Column[]): boolean {
  const statusCol = getStatusColumn(columns)
  const doneOpt = getDoneOption(statusCol)
  if (!statusCol || !doneOpt) return false
  return task.values[statusCol.id] === doneOpt.id
}

// ── Badge style ───────────────────────────────────────────────────────────────

/** Consistent colored-badge style used across table cells and kanban cards. */
export function optionBadgeStyle(color: string | null | undefined): React.CSSProperties {
  if (!color) return {}
  return {
    backgroundColor: color + '33',
    borderColor: color,
    color,
  }
}

/** Slightly dimmer variant used for priority badges on kanban cards. */
export function priorityBadgeStyle(color: string | null | undefined): React.CSSProperties {
  if (!color) return {}
  return {
    backgroundColor: color + '22',
    borderColor: color + '55',
    color,
  }
}
