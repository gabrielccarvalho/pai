'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import { Badge } from '@workspace/ui/components/badge'
import { Input } from '@workspace/ui/components/input'
import { Add01Icon, Tick02Icon } from '@/components/icons'
import { cn } from '@workspace/ui/lib/utils'
import type { ColumnOption } from '../../../lib/types'

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#64748b',
]

interface CellSelectProps {
  value: string | null
  options: ColumnOption[]
  onChange: (value: string | null) => void
  onCreateOption?: (label: string) => Promise<ColumnOption>
  onUpdateOption?: (optionId: string, color: string | null) => Promise<void>
  multi?: boolean
  multiValue?: string[]
  onMultiChange?: (values: string[]) => void
}

export function CellSelect({
  value,
  options,
  onChange,
  onCreateOption,
  onUpdateOption,
  multi,
  multiValue,
  onMultiChange,
}: CellSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null)

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

  async function handleColorPick(optId: string, color: string | null) {
    setColorPickerFor(null)
    await onUpdateOption?.(optId, color)
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setColorPickerFor(null) }}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap items-center gap-1 px-2 py-1 text-sm min-h-[36px]">
          {multi ? (
            (selected as ColumnOption[]).length > 0 ? (
              (selected as ColumnOption[]).map((o) => (
                <Badge
                  key={o.id}
                  variant="secondary"
                  className="text-xs"
                  style={
                    o.color
                      ? ({ backgroundColor: o.color + '33', borderColor: o.color, color: o.color } as React.CSSProperties)
                      : {}
                  }
                >
                  {o.label}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )
          ) : selected ? (
            <Badge
              variant="secondary"
              className="text-xs"
              style={
                (selected as ColumnOption).color
                  ? ({ backgroundColor: (selected as ColumnOption).color + '33', borderColor: (selected as ColumnOption).color, color: (selected as ColumnOption).color } as React.CSSProperties)
                  : {}
              }
            >
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
        <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
          {filtered.map((o) => {
            const isSelected = multi ? multiValue?.includes(o.id) : value === o.id
            const pickerOpen = colorPickerFor === o.id
            return (
              <React.Fragment key={o.id}>
                <div
                  className={cn(
                    'group flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted',
                    isSelected && 'bg-muted',
                  )}
                >
                  {/* Colored dot — click to open color picker */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setColorPickerFor(pickerOpen ? null : o.id)
                    }}
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-border hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ backgroundColor: o.color ?? 'var(--muted-foreground)' }}
                    title="Change color"
                  />
                  {/* Label — click to select/deselect */}
                  <button
                    className="flex flex-1 items-center gap-2 text-left"
                    onClick={() => {
                      if (multi) {
                        toggleMulti(o.id)
                      } else {
                        onChange(isSelected ? null : o.id)
                        setOpen(false)
                      }
                    }}
                  >
                    <span className="flex-1 truncate">{o.label}</span>
                    {isSelected && <Tick02Icon className="h-3 w-3 shrink-0" />}
                  </button>
                </div>

                {/* Inline color picker */}
                {pickerOpen && onUpdateOption && (
                  <div className="mx-2 mb-1 flex flex-wrap gap-1 rounded border border-border bg-muted/40 p-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColorPick(o.id, c)}
                        className={cn(
                          'h-4 w-4 rounded-full ring-offset-background transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                          o.color === c && 'ring-2 ring-ring ring-offset-1',
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    {/* Clear color */}
                    <button
                      onClick={() => handleColorPick(o.id, null)}
                      className={cn(
                        'h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground/50 ring-offset-background transition-all hover:scale-110 focus:outline-none',
                        !o.color && 'ring-2 ring-ring ring-offset-1',
                      )}
                      title="No color"
                    />
                  </div>
                )}
              </React.Fragment>
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
