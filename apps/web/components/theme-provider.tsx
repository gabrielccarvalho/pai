"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { applyAccentColor, DEFAULT_ACCENT_COLOR } from "@/hooks/use-settings"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("pai:settings")
      const color = raw ? (JSON.parse(raw).accentColor ?? DEFAULT_ACCENT_COLOR) : DEFAULT_ACCENT_COLOR
      applyAccentColor(color)
    } catch {
      applyAccentColor(DEFAULT_ACCENT_COLOR)
    }
  }, [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </NextThemesProvider>
  )
}

export { ThemeProvider }
