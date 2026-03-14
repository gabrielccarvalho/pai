export type ColumnType =
  | 'text'
  | 'number_integer'
  | 'number_float'
  | 'number_hour'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'url'

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
  icon: string | null
  width: number | null
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

export interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  progress: number | null
  eventId: string | null
  eventCalendarId: string | null
  eventSummary: string | null
  order: number
  parentId: string | null
  subTodos: Todo[]
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
