'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@workspace/ui/components/dropdown-menu'
import {
  Briefcase01Icon,
  BulbIcon,
  Calendar01Icon,
  Chart01Icon,
  CheckListIcon,
  Clock01Icon,
  CrownIcon,
  Delete01Icon,
  EyeIcon,
  FilterIcon,
  FireIcon,
  Flag01Icon,
  Folder01Icon,
  GlobeIcon,
  HashtagIcon,
  IdeaIcon,
  LabelIcon,
  Link01Icon,
  LockIcon,
  Note01Icon,
  PencilEdit01Icon,
  PinIcon,
  RocketIcon,
  Sorting01Icon,
  StarIcon,
  Tag01Icon,
  Target01Icon,
  Task01Icon,
  TextSquareIcon,
  UserIcon,
} from '@/components/icons'
import { cn } from '@workspace/ui/lib/utils'
import type { Column, ColumnType } from '../../../lib/types'

const DEFAULT_TYPE_ICONS: Record<ColumnType, React.ElementType> = {
  text: TextSquareIcon,
  number_integer: HashtagIcon,
  number_float: HashtagIcon,
  number_hour: HashtagIcon,
  select: Sorting01Icon,
  multiselect: FilterIcon,
  date: Calendar01Icon,
}

export const ICON_OPTIONS: { key: string; label: string; Component: React.ElementType }[] = [
  { key: 'text', label: 'Text', Component: TextSquareIcon },
  { key: 'hashtag', label: 'Number', Component: HashtagIcon },
  { key: 'calendar', label: 'Calendar', Component: Calendar01Icon },
  { key: 'select', label: 'Select', Component: Sorting01Icon },
  { key: 'filter', label: 'Filter', Component: FilterIcon },
  { key: 'task', label: 'Task', Component: Task01Icon },
  { key: 'checklist', label: 'Checklist', Component: CheckListIcon },
  { key: 'star', label: 'Star', Component: StarIcon },
  { key: 'flag', label: 'Flag', Component: Flag01Icon },
  { key: 'user', label: 'User', Component: UserIcon },
  { key: 'clock', label: 'Clock', Component: Clock01Icon },
  { key: 'briefcase', label: 'Briefcase', Component: Briefcase01Icon },
  { key: 'tag', label: 'Tag', Component: Tag01Icon },
  { key: 'label', label: 'Label', Component: LabelIcon },
  { key: 'target', label: 'Target', Component: Target01Icon },
  { key: 'folder', label: 'Folder', Component: Folder01Icon },
  { key: 'globe', label: 'Globe', Component: GlobeIcon },
  { key: 'eye', label: 'Eye', Component: EyeIcon },
  { key: 'link', label: 'Link', Component: Link01Icon },
  { key: 'rocket', label: 'Rocket', Component: RocketIcon },
  { key: 'crown', label: 'Crown', Component: CrownIcon },
  { key: 'fire', label: 'Fire', Component: FireIcon },
  { key: 'note', label: 'Note', Component: Note01Icon },
  { key: 'chart', label: 'Chart', Component: Chart01Icon },
  { key: 'lock', label: 'Lock', Component: LockIcon },
  { key: 'pin', label: 'Pin', Component: PinIcon },
  { key: 'idea', label: 'Idea', Component: IdeaIcon },
  { key: 'bulb', label: 'Bulb', Component: BulbIcon },
]

function getIconComponent(col: Column): React.ElementType {
  if (col.icon) {
    const found = ICON_OPTIONS.find((o) => o.key === col.icon)
    if (found) return found.Component
  }
  return DEFAULT_TYPE_ICONS[col.type] ?? TextSquareIcon
}

interface ColumnHeaderProps {
  column: Column
  onRename: (name: string) => void
  onDelete: () => void
  onChangeIcon: (icon: string | null) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}

export function ColumnHeader({
  column,
  onRename,
  onDelete,
  onChangeIcon,
  dragHandleProps,
}: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(column.name)
  const Icon = getIconComponent(column)

  function commitRename() {
    setEditing(false)
    if (draft.trim() && draft !== column.name) onRename(draft.trim())
    else setDraft(column.name)
  }

  return (
    <div className="flex h-8 items-center gap-1.5 px-2">
      {dragHandleProps && (
        <button
          className="flex h-4 w-3 shrink-0 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...dragHandleProps}
          tabIndex={-1}
        >
          <svg viewBox="0 0 6 14" className="h-3.5 w-2.5 text-muted-foreground" fill="currentColor">
            <circle cx="1.5" cy="2" r="1.2" /><circle cx="4.5" cy="2" r="1.2" />
            <circle cx="1.5" cy="7" r="1.2" /><circle cx="4.5" cy="7" r="1.2" />
            <circle cx="1.5" cy="12" r="1.2" /><circle cx="4.5" cy="12" r="1.2" />
          </svg>
        </button>
      )}
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
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <PencilEdit01Icon className="mr-2 h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon className="mr-2 h-3.5 w-3.5" />
              Change icon
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-1.5">
              <div className="grid grid-cols-7 gap-0.5">
                {ICON_OPTIONS.map(({ key, label, Component }) => (
                  <button
                    key={key}
                    title={label}
                    onClick={() => onChangeIcon(key)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-muted',
                      column.icon === key && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <Component className="h-3.5 w-3.5 text-foreground" />
                  </button>
                ))}
              </div>
              {column.icon && (
                <button
                  onClick={() => onChangeIcon(null)}
                  className="mt-1.5 w-full rounded px-2 py-1 text-left text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Reset to default
                </button>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
