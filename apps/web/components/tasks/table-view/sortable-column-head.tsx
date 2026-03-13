'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TableHead } from '@workspace/ui/components/table'
import { cn } from '@workspace/ui/lib/utils'
import type { Header } from '@tanstack/react-table'
import type { Task } from '../../../lib/types'

interface SortableColumnHeadProps {
  header: Header<Task, unknown>
  children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode
}

export function SortableColumnHead({ header, children }: SortableColumnHeadProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
  })

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        width: header.column.getSize(),
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group relative h-8 border-r border-border p-0 last:border-r-0',
        isDragging && 'opacity-40',
      )}
    >
      {children({ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>)}
      {/* Resize handle */}
      <div
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        className={cn(
          'absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none',
          'opacity-0 transition-opacity group-hover:opacity-100',
          'bg-primary/40',
          header.column.getIsResizing() && 'bg-primary opacity-100',
        )}
      />
    </TableHead>
  )
}
