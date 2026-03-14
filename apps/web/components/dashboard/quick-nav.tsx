"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckListIcon,
  Calendar03Icon,
  TaskDaily01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@workspace/ui/components/card"

interface NavCardProps {
  href: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  title: string
  subtitle: string
}

function NavCard({ href, icon, title, subtitle }: NavCardProps) {
  return (
    <Link href={href}>
      <Card className="border-border/60 cursor-pointer transition-colors hover:bg-accent hover:border-border">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <HugeiconsIcon icon={icon} className="size-5 text-primary" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface QuickNavProps {
  eventsToday: number
  dueTodayCount: number
  openTasksCount: number
}

export function QuickNav({ eventsToday, dueTodayCount, openTasksCount }: QuickNavProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <NavCard
        href="/tasks"
        icon={CheckListIcon}
        title="Tasks"
        subtitle={`${openTasksCount} open task${openTasksCount !== 1 ? "s" : ""}`}
      />
      <NavCard
        href="/schedule"
        icon={Calendar03Icon}
        title="Schedule"
        subtitle={`${eventsToday} event${eventsToday !== 1 ? "s" : ""} today`}
      />
      <NavCard
        href="/todo"
        icon={TaskDaily01Icon}
        title="To-do"
        subtitle={`${dueTodayCount} due today`}
      />
    </div>
  )
}
