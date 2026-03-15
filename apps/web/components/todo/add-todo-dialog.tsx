"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Cancel01Icon,
  Tick02Icon,
  Add01Icon,
  Delete01Icon,
  ArrowDown01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import type { Todo } from "../../lib/types"

interface SubTodoDraft {
  id?: string
  title: string
  completed: boolean
}

interface CalendarEventOption {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  calendarId: string
}

interface AddTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Todo | null
  onSave: (data: {
    title: string
    description: string | null
    dueDate: string | null
    progress: number | null
    eventId: string | null
    eventCalendarId: string | null
    eventSummary: string | null
    subTodos: SubTodoDraft[]
  }) => Promise<void>
}

export function AddTodoDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: AddTodoDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueDateOpen, setDueDateOpen] = useState(false)
  const [subTodos, setSubTodos] = useState<SubTodoDraft[]>([])
  const [newSubTitle, setNewSubTitle] = useState("")

  // Event picker
  const [eventSearch, setEventSearch] = useState("")
  const [eventPickerOpen, setEventPickerOpen] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventOption[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOption | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(false)

  const [saving, setSaving] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "")
      setDescription(initial?.description ?? "")
      setDueDate(initial?.dueDate ? new Date(initial.dueDate) : undefined)
      setSubTodos(
        (initial?.subTodos ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          completed: s.completed,
        }))
      )
      setSelectedEvent(
        initial?.eventId
          ? {
              id: initial.eventId,
              summary: initial.eventSummary ?? initial.eventId,
              start: {},
              calendarId: initial.eventCalendarId ?? "",
            }
          : null
      )
      setEventSearch("")
      setNewSubTitle("")
    }
  }, [open, initial])

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const now = new Date().toISOString()
      const future = addDays(new Date(), 14).toISOString()
      const calRes = await fetch('/api/schedule/calendars')
      const calendarIds = calRes.ok
        ? (await calRes.json() as { id: string }[]).map((c) => c.id).join(',')
        : 'primary'
      const res = await fetch(
        `/api/schedule/events?timeMin=${now}&timeMax=${future}&calendarIds=${encodeURIComponent(calendarIds)}`
      )
      if (res.ok) {
        const data: CalendarEventOption[] = await res.json()
        setCalendarEvents(data)
      }
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  const handleEventPickerOpen = (open: boolean) => {
    setEventPickerOpen(open)
    if (open && calendarEvents.length === 0) fetchEvents()
  }

const filteredEvents = eventSearch.trim()
    ? calendarEvents.filter((e) =>
        e.summary.toLowerCase().includes(eventSearch.toLowerCase())
      )
    : calendarEvents

  function addSubTodo() {
    const trimmed = newSubTitle.trim()
    if (!trimmed) return
    setSubTodos((prev) => [...prev, { title: trimmed, completed: false }])
    setNewSubTitle("")
  }

  function toggleSubTodo(index: number) {
    setSubTodos((prev) =>
      prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s))
    )
  }

  function removeSubTodo(index: number) {
    setSubTodos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? dueDate.toISOString() : null,
        progress: null,
        eventId: selectedEvent?.id ?? null,
        eventCalendarId: selectedEvent?.calendarId ?? null,
        eventSummary: selectedEvent?.summary ?? null,
        subTodos,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{initial ? "Edit To-do" : "New To-do"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1.5">
            <Label>Due date</Label>
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    className="mr-2 size-4"
                    strokeWidth={2}
                  />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    setDueDate(d)
                    setDueDateOpen(false)
                  }}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
                {dueDate && (
                  <div className="border-t border-border p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setDueDate(undefined)
                        setDueDateOpen(false)
                      }}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Event picker */}
          <div className="flex flex-col gap-1.5">
            <Label>Linked event</Label>
            <Popover open={eventPickerOpen} onOpenChange={handleEventPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-between font-normal",
                    !selectedEvent && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {selectedEvent ? selectedEvent.summary : "Link a calendar event..."}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className="ml-2 size-4 shrink-0 opacity-50"
                    strokeWidth={2}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="flex items-center border-b border-border px-3 py-2">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="mr-2 size-4 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {loadingEvents ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Loading events...
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No events found
                    </div>
                  ) : (
                    filteredEvents.map((ev) => {
                      const date = ev.start.dateTime
                        ? format(new Date(ev.start.dateTime), "MMM d, h:mm a")
                        : ev.start.date
                          ? format(new Date(ev.start.date), "MMM d")
                          : ""
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setSelectedEvent(ev)
                            setEventPickerOpen(false)
                          }}
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            className={cn(
                              "size-4 shrink-0",
                              selectedEvent?.id === ev.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                            strokeWidth={2}
                          />
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium">{ev.summary}</div>
                            {date && (
                              <div className="text-xs text-muted-foreground">{date}</div>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
                {selectedEvent && (
                  <div className="border-t border-border p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setSelectedEvent(null)
                        setEventPickerOpen(false)
                      }}
                    >
                      Clear event
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Sub-todos */}
          <div className="flex flex-col gap-1.5">
            <Label>Sub-tasks</Label>
            <div className="rounded-md border border-border">
              {subTodos.length > 0 && (
                <div className="divide-y divide-border">
                  {subTodos.map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubTodo(i)}
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          sub.completed
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {sub.completed && (
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            className="size-2.5 text-primary-foreground"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          sub.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubTodo(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          className="size-3.5"
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2">
                <HugeiconsIcon
                  icon={Add01Icon}
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={2}
                />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Add a sub-task..."
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSubTodo()
                    }
                  }}
                />
                {newSubTitle.trim() && (
                  <button
                    type="button"
                    onClick={addSubTodo}
                    className="text-primary"
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Saving..." : initial ? "Save changes" : "Add to-do"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
