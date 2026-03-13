export type ColumnType =
  | 'text'
  | 'number_integer'
  | 'number_float'
  | 'number_hour'
  | 'select'
  | 'multiselect'
  | 'date'

export interface ColumnOption {
  id: string
  label: string
  color: string | null
  order: number
  columnId: string
}

export interface Column {
  id: string
  name: string
  type: ColumnType
  order: number
  boardId: string
  options: ColumnOption[]
}

export interface Task {
  id: string
  order: number
  values: Record<string, unknown>
  boardId: string
  createdAt: string
  updatedAt: string
}

export interface TaskBoard {
  id: string
  name: string
  userId: string
  columns: Column[]
  tasks: Task[]
}
