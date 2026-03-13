'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import { Badge } from '@workspace/ui/components/badge'
import { Input } from '@workspace/ui/components/input'
import { Add01Icon, Tick02Icon } from '@/components/icons'
import { cn } from '@workspace/ui/lib/utils'
import type { ColumnOption } from '../../../lib/types'

interface CellSelectProps {
  value: string | null
  options: ColumnOption[]
  onChange: (value: string | null) => void
  onCreateOption?: (label: string) => Promise<ColumnOption>
  multi?: boolean
  multiValue?: string[]
  onMultiChange?: (values: string[]) => void
}

export function CellSelect({
  value,
  options,
  onChange,
  onCreateOption,
  multi,
  multiValue,
  onMultiChange,
}: CellSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const selected = multi
    ? options.filter((o) => multiValue?.includes(o.id))
    : options.find((o) => o.id === value) ?? null

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))

  async function handleCreate() {
    if (!search.trim() || !onCreateOption) return
    setCreating(true)
    try {
      const opt = await onCreateOption(search.trim())
      if (multi && onMultiChange) {
        onMultiChange([...(multiValue ?? []), opt.id])
      } else {
        onChange(opt.id)
      }
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  function toggleMulti(id: string) {
    if (!onMultiChange) return
    const current = multiValue ?? []
    if (current.includes(id)) {
      onMultiChange(current.filter((v) => v !== id))
    } else {
      onMultiChange([...current, id])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap items-center gap-1 px-2 py-1 text-sm min-h-[36px]">
          {multi ? (
            (selected as ColumnOption[]).length > 0 ? (
              (selected as ColumnOption[]).map((o) => (
                <Badge key={o.id} variant="secondary" className="text-xs" style={o.color ? { backgroundColor: o.color + '33', borderColor: o.color, color: o.color } as React.CSSProperties : {}}>
                  {o.label}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )
          ) : selected ? (
            <Badge variant="secondary" className="text-xs" style={(selected as ColumnOption).color ? { backgroundColor: (selected as ColumnOption).color + '33', borderColor: (selected as ColumnOption).color, color: (selected as ColumnOption).color } as React.CSSProperties : {}}>
              {(selected as ColumnOption).label}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder="Search or create..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
        />
        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
          {filtered.map((o) => {
            const isSelected = multi ? multiValue?.includes(o.id) : value === o.id
            return (
              <button
                key={o.id}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors',
                  isSelected && 'bg-muted',
                )}
                onClick={() => {
                  if (multi) {
                    toggleMulti(o.id)
                  } else {
                    onChange(isSelected ? null : o.id)
                    setOpen(false)
                  }
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: o.color ?? 'var(--muted-foreground)' }}
                />
                <span className="flex-1 truncate">{o.label}</span>
                {isSelected && <Tick02Icon className="h-3 w-3 shrink-0" />}
              </button>
            )
          })}

          {search && !filtered.find((o) => o.label.toLowerCase() === search.toLowerCase()) && onCreateOption && (
            <button
              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors text-muted-foreground"
              onClick={handleCreate}
              disabled={creating}
            >
              <Add01Icon className="h-3 w-3 shrink-0" />
              Create &quot;{search}&quot;
            </button>
          )}

          {filtered.length === 0 && !search && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No options</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
