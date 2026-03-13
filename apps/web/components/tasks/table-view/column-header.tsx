'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu'
import {
  TextSquareIcon,
  HashtagIcon,
  Sorting01Icon,
  Calendar01Icon,
  FilterIcon,
  Delete01Icon,
  PencilEdit01Icon,
} from '@/components/icons'
import { cn } from '@workspace/ui/lib/utils'
import type { Column, ColumnType } from '../../../lib/types'

const TYPE_ICONS: Record<ColumnType, React.ElementType> = {
  text: TextSquareIcon,
  number_integer: HashtagIcon,
  number_float: HashtagIcon,
  number_hour: HashtagIcon,
  select: Sorting01Icon,
  multiselect: FilterIcon,
  date: Calendar01Icon,
}

interface ColumnHeaderProps {
  column: Column
  onRename: (name: string) => void
  onDelete: () => void
}

export function ColumnHeader({ column, onRename, onDelete }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(column.name)
  const Icon = TYPE_ICONS[column.type] ?? TextSquareIcon

  function commitRename() {
    setEditing(false)
    if (draft.trim() && draft !== column.name) onRename(draft.trim())
    else setDraft(column.name)
  }

  return (
    <div className="flex h-8 items-center gap-1.5 px-3">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {editing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent text-xs font-medium outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setDraft(column.name)
              setEditing(false)
            }
          }}
        />
      ) : (
        <span className="flex-1 truncate text-xs font-medium">{column.name}</span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            'flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100',
          )}>
            <span className="sr-only">Column options</span>
            <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current text-muted-foreground">
              <circle cx="8" cy="3" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <PencilEdit01Icon className="mr-2 h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Delete01Icon className="mr-2 h-3.5 w-3.5" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
