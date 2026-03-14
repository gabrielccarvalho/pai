"use client"

import Link from "next/link"
import { format, parseISO, isWithinInterval, isBefore } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import type { CalendarEvent } from "../../lib/types"

const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6c026",
  "6": "#f5511d",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#d60000",
}

const DEFAULT_COLOR = "#7986cb"

function getEventColor(colorId: string | null): string {
  if (!colorId) return DEFAULT_COLOR
  return GOOGLE_COLORS[colorId] ?? DEFAULT_COLOR
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return "All day"
  const start = event.start.dateTime ? parseISO(event.start.dateTime) : null
  const end = event.end.dateTime ? parseISO(event.end.dateTime) : null
  if (!start) return ""
  const startStr = format(start, "h:mm a")
  const endStr = end ? format(end, "h:mm a") : ""
  return endStr ? `${startStr} – ${endStr}` : startStr
}

function isHappeningNow(event: CalendarEvent, now: Date): boolean {
  if (event.allDay) return false
  if (!event.start.dateTime || !event.end.dateTime) return false
  return isWithinInterval(now, {
    start: parseISO(event.start.dateTime),
    end: parseISO(event.end.dateTime),
  })
}

function isPast(event: CalendarEvent, now: Date): boolean {
  if (event.allDay) return false
  if (!event.end.dateTime) return false
  return isBefore(parseISO(event.end.dateTime), now)
}

interface ScheduleWidgetProps {
  events: CalendarEvent[]
  loading: boolean
  authError: boolean
  now: Date
}

export function ScheduleWidget({ events, loading, authError, now }: ScheduleWidgetProps) {
  const allDayEvents = events.filter((e) => e.allDay)
  const timedEvents = events.filter((e) => !e.allDay)
  const allSorted = [...allDayEvents, ...timedEvents]
  const visible = allSorted.slice(0, 3)
  const hasMore = allSorted.length > 3

  return (
    <Card className="border-border/60 flex flex-col" style={{ height: "320px" }}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm font-semibold">Today&apos;s Schedule</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="space-y-2 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : authError ? (
          <div className="flex flex-col flex-1 items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to see events here.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">No events today</p>
          </div>
        ) : (
          <>
            <div className="space-y-1 flex-1">
              {visible.map((event) => {
                const color = getEventColor(event.colorId)
                const happening = isHappeningNow(event, now)
                const past = isPast(event, now)

                if (event.allDay) {
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-2 py-1 ${past ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${past ? "grayscale" : ""}`}
                        style={{ backgroundColor: past ? "#94a3b8" : color }}
                      >
                        <span className={past ? "line-through" : ""}>{event.summary}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">All day</span>
                    </div>
                  )
                }

                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 ${past ? "opacity-40" : ""}`}
                  >
                    <div
                      className="h-full w-0.5 shrink-0 self-stretch rounded-full"
                      style={{
                        backgroundColor: past ? "#94a3b8" : color,
                        minHeight: "1.5rem",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm font-medium ${past ? "line-through text-muted-foreground" : ""}`}>
                          {event.summary}
                        </p>
                        {happening && (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                            Now
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatEventTime(event)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary">
                <Link href="/schedule">
                  {hasMore ? `+${allSorted.length - 3} more · See all` : "See all"} →
                </Link>
              </Button>
            </div>
          </>
        )}

        {(authError || visible.length === 0) && (
          <div className="flex justify-end pt-2 shrink-0">
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary">
              <Link href="/schedule">Go to Schedule →</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
