'use client'

import { TableIcon, KanbanIcon } from '@/components/icons'
import { cn } from '@workspace/ui/lib/utils'

export type TaskView = 'table' | 'kanban'

interface ViewSwitcherProps {
  view: TaskView
  onChange: (view: TaskView) => void
}

export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
          view === 'table'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onChange('table')}
      >
        <TableIcon className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
          view === 'kanban'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onChange('kanban')}
      >
        <KanbanIcon className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  )
}
