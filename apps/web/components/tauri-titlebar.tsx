"use client"

import { useEffect, useState } from "react"

export function TauriTitlebar() {
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    const tauri = "__TAURI__" in window
    setIsTauri(tauri)
    if (tauri) {
      document.documentElement.style.setProperty("--tauri-bar-height", "2rem")
      document.body.classList.add("pt-8")
    }
  }, [])

  if (!isTauri) return null

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-8 z-50 bg-sidebar"
    />
  )
}
