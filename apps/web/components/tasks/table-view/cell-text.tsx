'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@workspace/ui/lib/utils'

interface CellTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CellText({ value, onChange, placeholder }: CellTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit() {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  if (!editing) {
    return (
      <div
        className={cn(
          'h-full w-full cursor-text truncate px-3 py-2 text-sm',
          !value && 'text-muted-foreground',
        )}
        onClick={() => setEditing(true)}
      >
        {value || placeholder || ''}
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      className="h-full w-full bg-transparent px-3 py-2 text-sm outline-none ring-1 ring-inset ring-primary/50"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
    />
  )
}
