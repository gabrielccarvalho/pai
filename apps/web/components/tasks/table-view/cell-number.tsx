'use client'

import { useState, useRef, useEffect } from 'react'
import type { ColumnType } from '../../../lib/types'

interface CellNumberProps {
  value: number | null
  onChange: (value: number | null) => void
  type: ColumnType
}

function formatDisplay(value: number | null, type: ColumnType): string {
  if (value === null || value === undefined) return ''
  if (type === 'number_hour') {
    const h = Math.floor(value)
    const m = Math.round((value - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  if (type === 'number_float') return value.toFixed(2)
  return String(Math.round(value))
}

export function CellNumber({ value, onChange, type }: CellNumberProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value !== null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    setDraft(value !== null && value !== undefined ? String(value) : '')
  }, [value])

  function commit() {
    setEditing(false)
    const parsed = parseFloat(draft)
    const newVal = isNaN(parsed) ? null : parsed
    if (newVal !== value) onChange(newVal)
  }

  if (!editing) {
    return (
      <div
        className="h-full w-full cursor-text px-3 py-2 text-sm text-right"
        onClick={() => setEditing(true)}
      >
        {formatDisplay(value, type)}
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      type="number"
      className="h-full w-full bg-transparent px-3 py-2 text-sm text-right outline-none ring-1 ring-inset ring-primary/50"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') {
          setDraft(value !== null ? String(value) : '')
          setEditing(false)
        }
      }}
    />
  )
}
