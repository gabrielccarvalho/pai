"use client"

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react"
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  format,
  isToday,
  isSameDay,
  isSameMonth,
  parseISO,
  differenceInMinutes,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns"
import { cn } from "@workspace/ui/lib/utils"
import { PageHeader } from "../page-header"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

// ── Types ──────────────────────────────────────────────────────────────────────

interface CalendarEventTime {
  dateTime?: string
  date?: string
  timeZone?: string
}

interface CalendarEvent {
  id: string
  summary: string
  description: string | null
  location: string | null
  start: CalendarEventTime
  end: CalendarEventTime
  colorId: string | null
  htmlLink: string | null
  allDay: boolean
  selfResponseStatus: string
  calendarId: string
}

interface GoogleCalendar {
  id: string
  summary: string
  backgroundColor: string
  foregroundColor: string
  selected: boolean
  primary: boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const CALENDAR_CONFIG = {
  weekStartsOn: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6, // 0 = Sunday
  dayScrollStartHour: 6, // scroll to 6am on initial load
  eventRefreshIntervalMinutes: 5, // background refresh interval
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64
const START_HOUR = 0
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MINI_DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

const GOOGLE_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  "1": { bg: "#cce9ff", border: "#7ac1ff", text: "#0058a3" },
  "2": { bg: "#d4edda", border: "#82c591", text: "#1b5e20" },
  "3": { bg: "#ede0ff", border: "#b97cf3", text: "#5c0fa8" },
  "4": { bg: "#fde8ee", border: "#f48aab", text: "#92003b" },
  "5": { bg: "#fff9c4", border: "#f6c843", text: "#7a5900" },
  "6": { bg: "#ffe0b2", border: "#ff9a44", text: "#8a3600" },
  "7": { bg: "#d0f0fd", border: "#45bef7", text: "#00527a" },
  "8": { bg: "#e8eaed", border: "#adb5bd", text: "#3c4043" },
  "9": { bg: "#d2e3fc", border: "#5b8fe8", text: "#1a3a8c" },
  "10": { bg: "#ceead6", border: "#4caf7a", text: "#0d5c2e" },
  "11": { bg: "#fad2cf", border: "#f2836b", text: "#8b1a0c" },
}

const DEFAULT_COLOR = { bg: "#e8f0fe", border: "#4285f4", text: "#1a4ecf" }

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return null
  return {
    r: parseInt(m[1]!.slice(0, 2), 16),
    g: parseInt(m[1]!.slice(2, 4), 16),
    b: parseInt(m[1]!.slice(4, 6), 16),
  }
}

function eventColor(
  colorId: string | null,
  calendarBg?: string
): { bg: string; border: string; text: string } {
  if (colorId && GOOGLE_COLORS[colorId]) return GOOGLE_COLORS[colorId]!
  if (calendarBg) {
    const rgb = hexToRgb(calendarBg)
    if (rgb) {
      const { r, g, b } = rgb
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return {
        bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
        border: calendarBg,
        text:
          luminance > 0.5
            ? `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`
            : calendarBg,
      }
    }
  }
  return DEFAULT_COLOR
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

const EVENT_MARGIN_PX = 2

function eventTopPx(event: CalendarEvent): number {
  if (!event.start.dateTime) return EVENT_MARGIN_PX
  const dt = parseISO(event.start.dateTime)
  return (
    ((dt.getHours() * 60 + dt.getMinutes() - START_HOUR * 60) / 60) *
      HOUR_HEIGHT +
    EVENT_MARGIN_PX
  )
}

const MIN_EVENT_HEIGHT_PX = 20

function eventHeightPx(event: CalendarEvent): number {
  if (!event.start.dateTime || !event.end.dateTime)
    return Math.max(HOUR_HEIGHT / 2 - EVENT_MARGIN_PX * 2, MIN_EVENT_HEIGHT_PX)
  const minutes = differenceInMinutes(
    parseISO(event.end.dateTime),
    parseISO(event.start.dateTime)
  )
  return Math.max(
    (minutes / 60) * HOUR_HEIGHT - EVENT_MARGIN_PX * 2,
    MIN_EVENT_HEIGHT_PX
  )
}

function currentTimePx(): number {
  const now = new Date()
  return (
    ((now.getHours() * 60 + now.getMinutes() - START_HOUR * 60) / 60) *
    HOUR_HEIGHT
  )
}

function weekKey(date: Date): string {
  return format(
    startOfWeek(date, { weekStartsOn: CALENDAR_CONFIG.weekStartsOn }),
    "yyyy-MM-dd"
  )
}

// ── Session cache ──────────────────────────────────────────────────────────────

const SESSION_CACHE_PREFIX = "pai_cal_"
const SESSION_CALENDARS_KEY = "pai_cal_calendars"

interface SessionCacheEntry {
  data: CalendarEvent[]
  fetchedAt: number
}

function readSessionCache(key: string): SessionCacheEntry | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as SessionCacheEntry
  } catch {
    return null
  }
}

function writeSessionCache(key: string, data: CalendarEvent[]): void {
  try {
    sessionStorage.setItem(
      SESSION_CACHE_PREFIX + key,
      JSON.stringify({
        data,
        fetchedAt: Date.now(),
      } satisfies SessionCacheEntry)
    )
  } catch {
    // sessionStorage unavailable (quota exceeded, private browsing, etc.)
  }
}

function readCalendarsCache(): GoogleCalendar[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CALENDARS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GoogleCalendar[]
  } catch {
    return null
  }
}

function writeCalendarsCache(data: GoogleCalendar[]): void {
  try {
    sessionStorage.setItem(SESSION_CALENDARS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

interface LayoutEvent {
  event: CalendarEvent
  leftPct: number
  widthPct: number
  zIndex: number
}

function layoutEvents(events: CalendarEvent[]): LayoutEvent[] {
  if (events.length === 0) return []

  function getStartMs(e: CalendarEvent) {
    return e.start.dateTime ? parseISO(e.start.dateTime).getTime() : 0
  }
  function getEndMs(e: CalendarEvent) {
    return e.end.dateTime ? parseISO(e.end.dateTime).getTime() : 0
  }
  function getDuration(e: CalendarEvent) {
    return getEndMs(e) - getStartMs(e)
  }
  function overlaps(a: CalendarEvent, b: CalendarEvent) {
    return getStartMs(a) < getEndMs(b) && getEndMs(a) > getStartMs(b)
  }

  // Events that are longer (or same duration with lower id) take the "base" role
  function isBase(e: CalendarEvent, other: CalendarEvent) {
    const dA = getDuration(e),
      dB = getDuration(other)
    if (dA !== dB) return dA > dB
    return e.id < other.id
  }

  const SAME_START_MS = 2 * 60 * 1000 // 2-minute threshold for "same start"

  return events.map((event) => {
    const longerOverlapping = events.filter(
      (other) =>
        other !== event && overlaps(event, other) && isBase(other, event)
    )

    if (longerOverlapping.length === 0) {
      // This is the base event — full width, behind everything else
      return { event, leftPct: 0, widthPct: 100, zIndex: 1 }
    }

    // Use the longest overlapping event as reference
    const base = longerOverlapping.reduce((a, b) =>
      getDuration(a) >= getDuration(b) ? a : b
    )
    const sameStart =
      Math.abs(getStartMs(event) - getStartMs(base)) <= SAME_START_MS

    return {
      event,
      leftPct: sameStart ? 50 : 20,
      widthPct: sameStart ? 50 : 80,
      zIndex: longerOverlapping.length + 1,
    }
  })
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({
  weekStart,
  onSelectWeek,
}: {
  weekStart: Date
  onSelectWeek: (d: Date) => void
}) {
  const [month, setMonth] = useState(() => startOfMonth(weekStart))

  // Sync month when weekStart changes to a different month
  useEffect(() => {
    if (!isSameMonth(weekStart, month)) {
      setMonth(startOfMonth(weekStart))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  const firstDay = startOfWeek(month, {
    weekStartsOn: CALENDAR_CONFIG.weekStartsOn,
  })
  const lastDay = endOfWeek(endOfMonth(month), {
    weekStartsOn: CALENDAR_CONFIG.weekStartsOn,
  })
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })

  // Group into weeks (rows of 7)
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="shrink-0 px-3 pt-4 pb-2">
      {/* Month nav */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">
          {format(month, "MMMM yyyy")}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="mb-0.5 grid grid-cols-7">
        {MINI_DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="flex h-6 items-center justify-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => {
        const isSelectedWeek =
          weekStart >= (week[0] as Date) && weekStart <= (week[6] as Date)

        return (
          <div
            key={wi}
            onClick={() =>
              onSelectWeek(
                startOfWeek(week[0] as Date, {
                  weekStartsOn: CALENDAR_CONFIG.weekStartsOn,
                })
              )
            }
            className={cn(
              "grid cursor-pointer grid-cols-7 rounded-full transition-colors",
              isSelectedWeek ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            {week.map((day, di) => {
              const today = isToday(day)
              const inMonth = isSameMonth(day, month)
              return (
                <div key={di} className="flex h-7 items-center justify-center">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[11px]",
                      today &&
                        "bg-primary font-semibold text-primary-foreground",
                      !today && !inMonth && "text-muted-foreground/40",
                      !today && inMonth && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Calendar List ─────────────────────────────────────────────────────────────

function CalendarList({
  calendars,
  enabled,
  onToggle,
}: {
  calendars: GoogleCalendar[]
  enabled: Set<string>
  onToggle: (id: string) => void
}) {
  if (calendars.length === 0) return null

  const myCalendars = calendars.filter(
    (c) => c.primary || c.summary !== "Other calendars"
  )
  const otherCalendars = calendars.filter(
    (c) => !c.primary && c.summary === "Other calendars"
  )

  const renderCalendar = (cal: GoogleCalendar) => {
    const isEnabled = enabled.has(cal.id)
    return (
      <button
        key={cal.id}
        onClick={() => onToggle(cal.id)}
        className="group flex w-full items-center gap-2 rounded-md px-3 py-1 text-left transition-colors hover:bg-muted"
      >
        {/* Colored checkbox */}
        <div
          className="flex size-3.5 shrink-0 items-center justify-center rounded-sm transition-colors"
          style={{
            backgroundColor: isEnabled ? cal.backgroundColor : "transparent",
            border: `2px solid ${cal.backgroundColor}`,
          }}
        >
          {isEnabled && (
            <svg viewBox="0 0 10 10" className="size-2.5" fill="none">
              <path
                d="M1.5 5l2.5 2.5 4.5-4.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span
          className={cn(
            "truncate text-xs transition-opacity",
            !isEnabled && "opacity-40"
          )}
        >
          {cal.summary}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col py-2">
      <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        My calendars
      </p>
      {myCalendars.map(renderCalendar)}
      {otherCalendars.length > 0 && (
        <>
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Other calendars
          </p>
          {otherCalendars.map(renderCalendar)}
        </>
      )}
    </div>
  )
}

// ── Event Block ───────────────────────────────────────────────────────────────

function EventBlock({
  event,
  leftPct,
  widthPct,
  zIndex,
  calendarBg,
}: {
  event: CalendarEvent
  leftPct: number
  widthPct: number
  zIndex: number
  calendarBg?: string
}) {
  const color = eventColor(event.colorId, calendarBg)
  const top = eventTopPx(event)
  const height = eventHeightPx(event)
  const pending =
    event.selfResponseStatus === "needsAction" ||
    event.selfResponseStatus === "tentative"

  const startLabel = event.start.dateTime
    ? format(parseISO(event.start.dateTime), "HH:mm")
    : ""
  const endLabel = event.end.dateTime
    ? format(parseISO(event.end.dateTime), "HH:mm")
    : ""

  return (
    <a
      href={event.htmlLink ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute cursor-pointer overflow-hidden rounded-sm px-1.5 py-0.5 transition-[filter] select-none hover:brightness-95"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        zIndex,
        backgroundColor: pending ? "transparent" : color.bg,
        border: pending ? `2px dashed ${color.border}` : undefined,
        borderLeft: pending
          ? `2px dashed ${color.border}`
          : `3px solid ${color.border}`,
        color: color.text,
      }}
      title={`${event.summary}\n${startLabel}–${endLabel}${event.location ? `\n${event.location}` : ""}`}
    >
      <p className="truncate text-xs leading-tight font-semibold">
        {event.summary}
      </p>
      {height >= 32 && (
        <p className="text-xs leading-tight opacity-75">
          {startLabel}–{endLabel}
        </p>
      )}
    </a>
  )
}

// ── Week Nav ──────────────────────────────────────────────────────────────────

function WeekNav({
  onPrev,
  onNext,
  onToday,
}: {
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={onToday}>
        Today
      </Button>
      <Button variant="ghost" size="icon" className="size-8" onClick={onPrev}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="size-8" onClick={onNext}>
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
      </Button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ScheduleClient() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: CALENDAR_CONFIG.weekStartsOn })
  )
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [authError, setAuthError] = useState<string | null>(null)
  const [timePx, setTimePx] = useState(currentTimePx)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [enabledCalendars, setEnabledCalendars] = useState<Set<string>>(
    new Set()
  )
  const [calendarsLoaded, setCalendarsLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const eventsCache = useRef<Map<string, CalendarEvent[]>>(new Map())

  const weekDays = getWeekDays(weekStart)
  const weekEnd = endOfWeek(weekStart, {
    weekStartsOn: CALENDAR_CONFIG.weekStartsOn,
  })
  const headerSubtitle =
    format(weekStart, "MMM d") +
    " – " +
    format(
      weekEnd,
      weekStart.getMonth() === weekEnd.getMonth() ? "d, yyyy" : "MMM d, yyyy"
    )

  // Build a lookup map for calendar colors
  const calendarColorMap = new Map(
    calendars.map((c) => [c.id, c.backgroundColor])
  )

  // Hydrate calendar list from sessionStorage before first paint (client-only, not SSR).
  // setState calls here are intentional one-time initialization from an external store.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => {
    const cached = readCalendarsCache()
    if (cached) {
      setCalendars(cached)
      setEnabledCalendars(new Set(cached.map((c) => c.id)))
      setCalendarsLoaded(true)
    }
  }, [])

  // Fetch fresh calendar list on mount
  useEffect(() => {
    async function fetchCalendars() {
      try {
        const res = await fetch("/api/schedule/calendars")
        if (!res.ok) return
        const data: GoogleCalendar[] = await res.json()
        setCalendars(data)
        setEnabledCalendars(new Set(data.map((c) => c.id)))
        setCalendarsLoaded(true)
        writeCalendarsCache(data)
      } catch {
        // Silently ignore — events will fall back to primary
      }
    }
    fetchCalendars()
  }, [])

  // Fetches one week, stores result in cache, returns events (or null on error)
  const fetchWeek = useCallback(
    async (
      weekStartDate: Date,
      calIds: string[]
    ): Promise<CalendarEvent[] | null> => {
      try {
        const timeMin = startOfDay(weekStartDate).toISOString()
        const timeMax = endOfWeek(weekStartDate, {
          weekStartsOn: CALENDAR_CONFIG.weekStartsOn,
        }).toISOString()
        const calendarIdsParam =
          calIds.length > 0 ? calIds.join(",") : "primary"
        const res = await fetch(
          `/api/schedule/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&calendarIds=${encodeURIComponent(calendarIdsParam)}`
        )
        if (res.status === 401) {
          const body = await res.json()
          setAuthError(body.message ?? "Google account not connected.")
          return null
        }
        if (!res.ok) return null
        const data: CalendarEvent[] = await res.json()
        const key = weekKey(weekStartDate)
        eventsCache.current.set(key, data)
        writeSessionCache(key, data)
        return data
      } catch {
        return null
      }
    },
    []
  )

  // Load events for the current week; show cache immediately, then refresh in background
  useEffect(() => {
    let cancelled = false
    const calIds = calendars.length > 0 ? calendars.map((c) => c.id) : []
    const key = weekKey(weekStart)
    const refreshMs = CALENDAR_CONFIG.eventRefreshIntervalMinutes * 60 * 1000

    // 1. In-memory cache → instant display
    const inMemory = eventsCache.current.get(key)
    let needsFetch = true

    if (inMemory) {
      setEvents(inMemory)
    } else {
      // 2. sessionStorage → survives tab switches
      const session = readSessionCache(key)
      if (session) {
        eventsCache.current.set(key, session.data) // warm up in-memory cache
        setEvents(session.data)
        needsFetch = Date.now() - session.fetchedAt >= refreshMs
      }
    }

    if (needsFetch) {
      fetchWeek(weekStart, calIds).then((data) => {
        if (cancelled) return
        if (data) setEvents(data)
        fetchWeek(subWeeks(weekStart, 1), calIds)
        fetchWeek(addWeeks(weekStart, 1), calIds)
      })
    } else {
      // Data is still fresh — only prefetch adjacent weeks
      fetchWeek(subWeeks(weekStart, 1), calIds)
      fetchWeek(addWeeks(weekStart, 1), calIds)
    }

    return () => {
      cancelled = true
    }
  }, [weekStart, calendars, fetchWeek])

  // Background refresh every N minutes
  useEffect(() => {
    const ms = CALENDAR_CONFIG.eventRefreshIntervalMinutes * 60 * 1000
    const interval = setInterval(() => {
      const calIds = calendars.length > 0 ? calendars.map((c) => c.id) : []
      fetchWeek(weekStart, calIds).then((data) => {
        if (data) setEvents(data)
      })
      fetchWeek(subWeeks(weekStart, 1), calIds)
      fetchWeek(addWeeks(weekStart, 1), calIds)
    }, ms)
    return () => clearInterval(interval)
  }, [weekStart, calendars, fetchWeek])

  // Scroll to day start hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        CALENDAR_CONFIG.dayScrollStartHour * HOUR_HEIGHT
    }
  }, [])

  // Update current time indicator every minute
  useEffect(() => {
    const interval = setInterval(() => setTimePx(currentTimePx()), 60_000)
    return () => clearInterval(interval)
  }, [])

  function toggleCalendar(id: string) {
    setEnabledCalendars((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Map "primary" calendarId to the real primary calendar ID (for events cached before calendar list loaded)
  const primaryCalId = calendars.find((c) => c.primary)?.id

  // Filter events by enabled calendars (show all if calendar list hasn't loaded yet)
  const visibleEvents = !calendarsLoaded
    ? events
    : events.filter((e) => {
        const id =
          e.calendarId === "primary" && primaryCalId
            ? primaryCalId
            : e.calendarId
        return enabledCalendars.has(id)
      })

  const allDayEvents = visibleEvents.filter((e) => e.allDay)
  const timedEvents = visibleEvents.filter((e) => !e.allDay)

  const timedByDay = weekDays.map((day) =>
    timedEvents.filter(
      (e) => e.start.dateTime && isSameDay(parseISO(e.start.dateTime), day)
    )
  )

  const allDayByDay = weekDays.map((day) =>
    allDayEvents.filter(
      (e) => e.start.date && isSameDay(parseISO(e.start.date), day)
    )
  )

  const hasAnyAllDay = allDayByDay.some((d) => d.length > 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Schedule"
        subtitle={headerSubtitle}
        actions={
          <WeekNav
            onPrev={() => setWeekStart((w) => subWeeks(w, 1))}
            onNext={() => setWeekStart((w) => addWeeks(w, 1))}
            onToday={() =>
              setWeekStart(
                startOfWeek(new Date(), {
                  weekStartsOn: CALENDAR_CONFIG.weekStartsOn,
                })
              )
            }
          />
        }
      />

      {authError ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-sm text-center">
            <p className="text-sm font-medium text-destructive">{authError}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign out and sign back in to reconnect your Google account.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left sidebar ── */}
          <div className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-border">
            <MiniCalendar weekStart={weekStart} onSelectWeek={setWeekStart} />
            <div className="mx-2 border-t border-border" />
            <CalendarList
              calendars={calendars}
              enabled={enabledCalendars}
              onToggle={toggleCalendar}
            />
          </div>

          {/* ── Main calendar area ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Day header row */}
            <div className="flex shrink-0 border-b border-border">
              <div className="w-16 shrink-0" />
              {weekDays.map((day, i) => {
                const today = isToday(day)
                return (
                  <div
                    key={i}
                    className="flex min-w-0 flex-1 flex-col items-center border-l border-border py-2"
                  >
                    <span
                      className={cn(
                        "text-xs font-medium tracking-wide uppercase",
                        today ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {DAYS[i]}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                        today
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* All-day row */}
            {hasAnyAllDay && (
              <div className="flex shrink-0 border-b border-border">
                <div className="flex w-16 shrink-0 items-start justify-end pt-1 pr-2">
                  <span className="text-[10px] text-muted-foreground">
                    all-day
                  </span>
                </div>
                {allDayByDay.map((dayEvents, i) => (
                  <div
                    key={i}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 border-l border-border p-1"
                  >
                    {dayEvents.map((event) => {
                      const color = eventColor(
                        event.colorId,
                        calendarColorMap.get(event.calendarId)
                      )
                      return (
                        <a
                          key={event.id}
                          href={event.htmlLink ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate rounded-sm px-1.5 py-0.5 text-xs font-medium transition-[filter] hover:brightness-95"
                          style={{
                            backgroundColor: color.bg,
                            borderLeft: `3px solid ${color.border}`,
                            color: color.text,
                          }}
                        >
                          {event.summary}
                        </a>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Scrollable time grid */}
            <div
              ref={scrollRef}
              className="relative flex-1 overflow-x-hidden overflow-y-auto"
            >
              <div
                className="relative flex"
                style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
              >
                {/* Time labels */}
                <div className="relative w-16 shrink-0">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute flex w-full justify-end pr-2"
                      style={{ top: `${h * HOUR_HEIGHT - 8}px` }}
                    >
                      <span className="text-[10px] text-muted-foreground select-none">
                        {h === 0
                          ? ""
                          : format(new Date(2000, 0, 1, h), "HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIdx) => {
                  const isCurrentDay = isToday(day)
                  const laid = layoutEvents(timedByDay[dayIdx] ?? [])

                  return (
                    <div
                      key={dayIdx}
                      className="relative min-w-0 flex-1 border-l border-border"
                    >
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="absolute w-full border-t border-border/50"
                          style={{ top: `${h * HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {isCurrentDay && (
                        <div
                          className="absolute right-0 left-0 z-20 flex items-center"
                          style={{ top: `${timePx}px` }}
                        >
                          <div className="-ml-1 size-2 shrink-0 rounded-full bg-destructive" />
                          <div className="h-px flex-1 bg-destructive" />
                        </div>
                      )}

                      {laid.map((item) => (
                        <EventBlock
                          key={item.event.id}
                          event={item.event}
                          leftPct={item.leftPct}
                          widthPct={item.widthPct}
                          zIndex={item.zIndex}
                          calendarBg={calendarColorMap.get(
                            item.event.calendarId
                          )}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
