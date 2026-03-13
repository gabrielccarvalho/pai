import type { ReactNode } from 'react'
import { cn } from '@workspace/ui/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border px-6 py-4',
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
