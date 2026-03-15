"use client"

import { useEffect, useState } from "react"

export interface AppSettings {
  theme: "light" | "dark" | "system"
  accentColor: string
  weekStartsOn: 0 | 1
  dayScrollStartHour: number
  eventRefreshIntervalMinutes: 5 | 10 | 15 | 30
  todoDefaultWindow: "today" | "this-week"
  todoDefaultSort: "due-asc" | "due-desc" | "completion"
  taskDefaultView: "table" | "kanban"
}

const SETTINGS_KEY = "pai:settings"

export const DEFAULT_ACCENT_COLOR = "#6d28d9"

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  accentColor: DEFAULT_ACCENT_COLOR,
  weekStartsOn: 0,
  dayScrollStartHour: 6,
  eventRefreshIntervalMinutes: 5,
  todoDefaultWindow: "today",
  todoDefaultSort: "due-asc",
  taskDefaultView: "table",
}

export function applyAccentColor(hex: string) {
  if (typeof document === "undefined") return
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const foreground = luminance > 0.5 ? "#18181b" : "#ffffff"
  document.documentElement.style.setProperty("--primary", hex)
  document.documentElement.style.setProperty("--primary-foreground", foreground)
  document.documentElement.style.setProperty("--ring", hex)
  document.documentElement.style.setProperty("--sidebar-primary", hex)
  document.documentElement.style.setProperty("--sidebar-primary-foreground", foreground)
}

function loadLocalSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS

  const raw = localStorage.getItem(SETTINGS_KEY)
  const stored: Partial<AppSettings> = raw ? JSON.parse(raw) : {}
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...stored }

  // Migrate legacy keys
  const legacyWindow = localStorage.getItem("pai:todo-window") as AppSettings["todoDefaultWindow"] | null
  const legacyTaskView = sessionStorage.getItem("pai:task-view") as AppSettings["taskDefaultView"] | null

  if (legacyWindow && !stored.todoDefaultWindow) {
    merged.todoDefaultWindow = legacyWindow
  }
  if (legacyTaskView && !stored.taskDefaultView) {
    merged.taskDefaultView = legacyTaskView
  }

  if (legacyWindow) localStorage.removeItem("pai:todo-window")
  if (legacyTaskView) sessionStorage.removeItem("pai:task-view")

  return merged
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadLocalSettings)

  // Hydrate from server on mount
  useEffect(() => {
    fetch("/api/user/settings")
      .then((res) => res.ok ? res.json() : null)
      .then((serverSettings: Partial<AppSettings> | null) => {
        if (!serverSettings || Object.keys(serverSettings).length === 0) return
        const merged = { ...DEFAULT_SETTINGS, ...serverSettings }
        setSettings(merged)
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
      })
      .catch(() => {/* fall back to localStorage */})
  }, [])

  function updateSettings(partial: Partial<AppSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    if (typeof window !== "undefined") {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    }
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {/* optimistic — localStorage already updated */})
  }

  return { settings, updateSettings }
}
