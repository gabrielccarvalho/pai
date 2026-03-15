"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { format, addDays } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Tick02Icon,
  Add01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
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

interface InlineEditTodoProps {
  todo: Todo
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
  onCancel: () => void
}

export function InlineEditTodo({ todo, onSave, onCancel }: InlineEditTodoProps) {
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description ?? "")
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo.dueDate ? new Date(todo.dueDate) : undefined
  )
  const [dueDateOpen, setDueDateOpen] = useState(false)
  const [subTodos, setSubTodos] = useState<SubTodoDraft[]>(
    todo.subTodos.map((s) => ({ id: s.id, title: s.title, completed: s.completed }))
  )
  const [newSubTitle, setNewSubTitle] = useState("")
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null)
  const [editingSubTitle, setEditingSubTitle] = useState("")
  const [eventSearch, setEventSearch] = useState("")
  const [eventPickerOpen, setEventPickerOpen] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventOption[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventOption | null>(
    todo.eventId
      ? {
          id: todo.eventId,
          summary: todo.eventSummary ?? todo.eventId,
          start: {},
          calendarId: todo.eventCalendarId ?? "",
        }
      : null
  )
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const now = new Date().toISOString()
      const future = addDays(new Date(), 14).toISOString()
      const res = await fetch(
        `/api/schedule/events?timeMin=${now}&timeMax=${future}&calendarIds=primary`
      )
      if (res.ok) setCalendarEvents(await res.json())
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  function handleEventPickerOpen(open: boolean) {
    setEventPickerOpen(open)
    if (open && calendarEvents.length === 0) fetchEvents()
  }

  const filteredEvents = eventSearch.trim()
    ? calendarEvents.filter((e) =>
        e.summary.toLowerCase().includes(eventSearch.toLowerCase())
      )
    : calendarEvents

  function startEditSub(index: number) {
    setEditingSubIndex(index)
    setEditingSubTitle(subTodos[index]!.title)
  }

  function commitEditSub() {
    if (editingSubIndex === null) return
    const trimmed = editingSubTitle.trim()
    if (trimmed) {
      setSubTodos((prev) =>
        prev.map((s, i) => (i === editingSubIndex ? { ...s, title: trimmed } : s))
      )
    }
    setEditingSubIndex(null)
    setEditingSubTitle("")
  }

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
    if (!title.trim() || saving) return
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Placeholder circle */}
        <div className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Title */}
          <input
            ref={titleRef}
            className="w-full bg-transparent font-medium leading-tight outline-none placeholder:text-muted-foreground"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel()
            }}
          />

          {/* Description */}
          <textarea
            className="w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Add description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel()
            }}
          />

          {/* Sub-tasks */}
          <div className="rounded-md border border-border">
            {subTodos.length > 0 && (
              <div className="divide-y divide-border">
                {subTodos.map((sub, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
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
                    {editingSubIndex === i ? (
                      <input
                        autoFocus
                        className="flex-1 bg-transparent text-sm outline-none"
                        value={editingSubTitle}
                        onChange={(e) => setEditingSubTitle(e.target.value)}
                        onBlur={commitEditSub}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            commitEditSub()
                          }
                          if (e.key === "Escape") {
                            setEditingSubIndex(null)
                            setEditingSubTitle("")
                          }
                        }}
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex-1 cursor-text text-sm",
                          sub.completed && "text-muted-foreground line-through"
                        )}
                        onClick={() => startEditSub(i)}
                      >
                        {sub.title}
                      </span>
                    )}
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
                  if (e.key === "Escape") onCancel()
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

          {/* Footer row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: date + event pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Due date */}
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent",
                      dueDate ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      className="size-3.5"
                      strokeWidth={2}
                    />
                    {dueDate ? format(dueDate, "MMM d") : "Due date"}
                  </button>
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

              {/* Event picker */}
              <Popover open={eventPickerOpen} onOpenChange={handleEventPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent",
                      selectedEvent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      className="size-3.5"
                      strokeWidth={2}
                    />
                    <span className="max-w-32 truncate">
                      {selectedEvent ? selectedEvent.summary : "Link event"}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      className="size-3 opacity-50"
                      strokeWidth={2}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
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
                  <div className="max-h-48 overflow-y-auto">
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
                              <div className="truncate font-medium">
                                {ev.summary}
                              </div>
                              {date && (
                                <div className="text-xs text-muted-foreground">
                                  {date}
                                </div>
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

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!title.trim() || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
