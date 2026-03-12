'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import type { ColumnType } from '../../../lib/types'

const COLUMN_TYPES: { value: ColumnType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Free text' },
  { value: 'select', label: 'Select', description: 'Single option' },
  { value: 'multiselect', label: 'Multi-select', description: 'Multiple options' },
  { value: 'date', label: 'Date', description: 'Calendar date' },
  { value: 'number_integer', label: 'Integer', description: 'Whole number' },
  { value: 'number_float', label: 'Decimal', description: 'Decimal number' },
  { value: 'number_hour', label: 'Hours', description: 'Time in hours' },
]

interface AddColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, type: ColumnType) => Promise<void>
}

export function AddColumnDialog({ open, onOpenChange, onAdd }: AddColumnDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ColumnType>('text')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onAdd(name.trim(), type)
      setName('')
      setType('text')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              autoFocus
              placeholder="Column name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {COLUMN_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    type === t.value
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                  }`}
                  onClick={() => setType(t.value)}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="text-[10px] opacity-70">{t.description}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              Add column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
