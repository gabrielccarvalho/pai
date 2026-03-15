"use client"

import { useTheme } from "next-themes"
import { cn } from "@workspace/ui/lib/utils"
import { useSettings, applyAccentColor } from "@/hooks/use-settings"

const ACCENT_PRESETS = [
  { label: "Violet", value: "#6d28d9" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Pink", value: "#db2777" },
  { label: "Black", value: "#18181b" },
]

function ThemePreview({ mode }: { mode: "light" | "dark" | "system" }) {
  const isDark = mode === "dark"
  const bg = isDark ? "#1c1c1e" : "#f5f5f5"
  const sidebarBg = isDark ? "#2c2c2e" : "#e8e8e8"
  const titlebarBg = isDark ? "#242426" : "#ebebeb"
  const dotColors = ["#ff5f57", "#febc2e", "#28c840"]
  const navItem = isDark ? "#3a3a3c" : "#d0d0d0"
  const contentBg = isDark ? "#1c1c1e" : "#f5f5f5"
  const block1 = isDark ? "#3a3a3c" : "#d8d8d8"
  const block2 = isDark ? "#2c2c2e" : "#e2e2e2"

  // system: dark sidebar + light content
  const sidebarBgFinal = mode === "system" ? "#2c2c2e" : sidebarBg
  const contentBgFinal = mode === "system" ? "#f5f5f5" : contentBg
  const navItemFinal = mode === "system" ? "#3a3a3c" : navItem
  const block1Final = mode === "system" ? "#d8d8d8" : block1
  const block2Final = mode === "system" ? "#e2e2e2" : block2

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 6, background: bg, border: "1px solid rgba(0,0,0,0.1)" }}>
      {/* titlebar */}
      <div style={{ height: 12, background: titlebarBg, borderBottom: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 3, paddingLeft: 6 }}>
        {dotColors.map((c, i) => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: c, display: "inline-block" }} />
        ))}
      </div>
      {/* body */}
      <div style={{ display: "flex", height: "calc(100% - 12px)" }}>
        {/* sidebar */}
        <div style={{ width: 28, flexShrink: 0, background: sidebarBgFinal, borderRight: "1px solid rgba(0,0,0,0.08)", padding: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, background: navItemFinal }} />
          ))}
        </div>
        {/* content */}
        <div style={{ flex: 1, background: contentBgFinal, padding: 5, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 6, width: "70%", borderRadius: 3, background: block1Final }} />
          <div style={{ height: 4, width: "45%", borderRadius: 3, background: block2Final }} />
          <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
            <div style={{ flex: 1, height: 18, borderRadius: 4, background: block2Final }} />
            <div style={{ flex: 1, height: 18, borderRadius: 4, background: block2Final }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const THEMES = [
  { id: "light" as const, label: "Light Mode" },
  { id: "dark" as const, label: "Dark Mode" },
  { id: "system" as const, label: "System" },
]

export function AppearanceSettings() {
  const { setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()

  function handleThemeChange(value: "light" | "dark" | "system") {
    setTheme(value)
    updateSettings({ theme: value })
  }

  function handleAccentColor(color: string) {
    applyAccentColor(color)
    updateSettings({ accentColor: color })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-base font-medium mb-1">Appearance</h2>
        <p className="text-sm text-muted-foreground">Customize the look of the app.</p>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Theme</label>
        <div style={{ display: "flex", gap: 12 }}>
          {THEMES.map(({ id, label }) => {
            const selected = settings.theme === id
            return (
              <button
                key={id}
                onClick={() => handleThemeChange(id)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border-2 p-2 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40"
                )}
                style={{ flex: 1, minWidth: 0 }}
              >
                <div style={{ width: "100%", height: 88 }}>
                  <ThemePreview mode={id} />
                </div>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    )}
                  >
                    {selected && (
                      <svg viewBox="0 0 8 8" className="size-2.5 text-primary-foreground" fill="none">
                        <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={cn("text-xs font-medium", selected ? "text-foreground" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Accent color */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium">Accent Color</label>
          <p className="text-xs text-muted-foreground mt-0.5">Choose a color for buttons and highlights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map(({ label, value }) => {
            const selected = settings.accentColor === value
            return (
              <button
                key={value}
                title={label}
                onClick={() => handleAccentColor(value)}
                className="size-7 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: value,
                  outline: selected ? `2px solid ${value}` : "none",
                  outlineOffset: selected ? "3px" : undefined,
                  transform: selected ? "scale(1.1)" : undefined,
                }}
              />
            )
          })}
          <label
            className="relative flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border hover:border-muted-foreground/50 transition-colors"
            title="Custom color"
          >
            <span className="text-[10px] text-muted-foreground">+</span>
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => handleAccentColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <span className="ml-1 text-xs text-muted-foreground font-mono">{settings.accentColor}</span>
        </div>
      </div>
    </div>
  )
}
