"use client"

import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { signIn } from "next-auth/react"
import { GoogleCalendarIcon } from "@/components/icons"

interface ConnectionsSettingsProps {
  userEmail: string
}

export function ConnectionsSettings({ userEmail }: ConnectionsSettingsProps) {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/schedule/calendars")
      .then((res) => setConnected(res.ok))
      .catch(() => setConnected(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-base font-medium">Connections</h2>
        <p className="text-sm text-muted-foreground">
          Manage your connected accounts and integrations.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-lg border p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <GoogleCalendarIcon className="size-8" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Google Calendar</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {connected === null ? (
            <span className="text-xs text-muted-foreground">Checking...</span>
          ) : connected ? (
            <span
              style={{ color: "oklch(62.7% 0.194 149.214)" }}
              className="flex items-center gap-1.5 text-xs text-green-600"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                strokeWidth={2}
                className="size-4"
              />
              Connected
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                Disconnected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => signIn("google")}
              >
                Reconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
