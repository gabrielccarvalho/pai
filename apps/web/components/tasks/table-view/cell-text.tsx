"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@workspace/ui/lib/utils"

interface CellTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
}

export function CellText({
  value,
  onChange,
  placeholder,
  multiline,
}: CellTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      if (multiline) {
        const el = textareaRef.current
        if (el) {
          el.focus()
          // move cursor to end
          el.selectionStart = el.selectionEnd = el.value.length
          // auto-size on open
          el.style.height = "auto"
          el.style.height = `${el.scrollHeight}px`
        }
      } else {
        inputRef.current?.focus()
      }
    }
  }, [editing, multiline])

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit() {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  if (!editing) {
    return (
      <div
        className={cn(
          "min-h-9 w-full cursor-text px-3 py-2 text-sm",
          multiline ? "break-words whitespace-pre-wrap" : "truncate",
          !value && "text-muted-foreground"
        )}
        onClick={() => setEditing(true)}
      >
        {value || placeholder || ""}
      </div>
    )
  }

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        className="w-full resize-none overflow-hidden bg-transparent px-3 py-2 text-sm ring-1 ring-primary/50 outline-none ring-inset"
        value={draft}
        rows={1}
        onChange={(e) => {
          setDraft(e.target.value)
          // auto-grow
          e.target.style.height = "auto"
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            commit()
          }
          if (e.key === "Escape") {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <input
      ref={inputRef}
      className="h-9 w-full bg-transparent px-3 py-2 text-sm ring-1 ring-primary/50 outline-none ring-inset"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") {
          setDraft(value)
          setEditing(false)
        }
      }}
    />
  )
}
