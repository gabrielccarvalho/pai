'use client'

import { useState, useRef } from 'react'
import { Link01Icon } from '@/components/icons'

interface CellUrlProps {
  value: string | null
  onChange: (value: string | null) => void
}

export function CellUrl({ value, onChange }: CellUrlProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function commit() {
    const trimmed = draft.trim()
    onChange(trimmed || null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-2 py-1">
        <input
          ref={inputRef}
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="https://..."
          className="h-7 w-full rounded border border-border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>
    )
  }

  if (!value) {
    return (
      <div
        className="flex h-full min-h-[36px] cursor-pointer items-center px-3 text-xs text-muted-foreground hover:text-foreground"
        onClick={startEdit}
      >
        —
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[36px] items-center gap-1 px-2">
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
      >
        <Link01Icon className="h-3 w-3 shrink-0" />
        Go to link
      </a>
      <button
        onClick={startEdit}
        className="ml-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
        title="Edit URL"
      >
        edit
      </button>
    </div>
  )
}
