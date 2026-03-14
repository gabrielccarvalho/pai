"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Alert02Icon,
  TaskDaily01Icon,
  CheckListIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@workspace/ui/components/card"

interface StatsRowProps {
  eventsToday: number
  overdueCount: number
  dueTodayCount: number
  openTasksCount: number
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  value: number
  label: string
  accent?: string
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-3xl font-bold tabular-nums ${accent ?? ""}`}>
              {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsRow({ eventsToday, overdueCount, dueTodayCount, openTasksCount }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        icon={Calendar03Icon}
        value={eventsToday}
        label="events today"
      />
      <StatCard
        icon={Alert02Icon}
        value={overdueCount}
        label="todos overdue"
        accent={overdueCount > 0 ? "text-destructive" : undefined}
      />
      <StatCard
        icon={TaskDaily01Icon}
        value={dueTodayCount}
        label="due today"
        accent={dueTodayCount > 0 ? "text-amber-500" : undefined}
      />
      <StatCard
        icon={CheckListIcon}
        value={openTasksCount}
        label="open tasks"
        accent="text-primary"
      />
    </div>
  )
}
