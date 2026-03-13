'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Task01Icon,
  Calendar01Icon,
  CheckListIcon,
  Settings01Icon,
} from '@/components/icons'
import { cn } from '@workspace/ui/lib/utils'

const navItems = [
  { href: '/tasks', label: 'Tasks', icon: Task01Icon },
  { href: '/schedule', label: 'Schedule', icon: Calendar01Icon },
  { href: '/todo', label: 'To-do', icon: CheckListIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          P
        </div>
        <span className="font-semibold text-sm tracking-tight">Personal Assistant</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings01Icon className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
