'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import { Calendar } from '@workspace/ui/components/calendar'
import { format, parseISO } from 'date-fns'

interface CellDateProps {
  value: string | null // ISO date string
  onChange: (value: string | null) => void
}

export function CellDate({ value, onChange }: CellDateProps) {
  const [open, setOpen] = useState(false)
  const date = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer items-center px-3 py-2 text-sm">
          {date ? (
            <span>{format(date, 'MMM d, yyyy')}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? format(d, 'yyyy-MM-dd') : null)
            setOpen(false)
          }}
          initialFocus
        />
        {value && (
          <div className="border-t p-2">
            <button
              className="w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
