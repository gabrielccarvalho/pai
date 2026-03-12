'use client'

import { Add01Icon } from '@/components/icons'

interface AddTaskRowProps {
  onAdd: () => void
}

export function AddTaskRow({ onAdd }: AddTaskRowProps) {
  return (
    <button
      className="flex h-9 w-full items-center gap-2 border-t border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      onClick={onAdd}
    >
      <Add01Icon className="h-3.5 w-3.5 shrink-0" />
      Add task
    </button>
  )
}
