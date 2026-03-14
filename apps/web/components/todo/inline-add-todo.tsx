"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Tick02Icon,
  Add01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"

interface SubTodoDraft {
  title: string
  completed: boolean
}

interface InlineAddTodoProps {
  onSave: (data: {
    title: string
    description: string | null
    dueDate: string | null
    subTodos: SubTodoDraft[]
  }) => Promise<void>
}

export function InlineAddTodo({ onSave }: InlineAddTodoProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [dueDateOpen, setDueDateOpen] = useState(false)
  const [subTodos, setSubTodos] = useState<SubTodoDraft[]>([])
  const [newSubTitle, setNewSubTitle] = useState("")
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null)
  const [editingSubTitle, setEditingSubTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => titleRef.current?.focus())
    }
  }, [open])

  function handleCancel() {
    setOpen(false)
    setTitle("")
    setDescription("")
    setDueDate(new Date())
    setSubTodos([])
    setNewSubTitle("")
  }

  function startEditSub(index: number) {
    setEditingSubIndex(index)
    setEditingSubTitle(subTodos[index].title)
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
        subTodos,
      })
      setTitle("")
      setDescription("")
      setDueDate(new Date())
      setSubTodos([])
      setNewSubTitle("")
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Closed state ─────────────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
      >
        <div className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-muted-foreground/30 transition-colors group-hover:border-primary/40" />
        <span>Add to-do</span>
      </button>
    )
  }

  // ── Open state ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Placeholder checkbox */}
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
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
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
              if (e.key === "Escape") handleCancel()
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
                  if (e.key === "Escape") handleCancel()
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
            {/* Due date pill */}
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
                  disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
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

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
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
