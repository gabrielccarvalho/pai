"use client"

import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useSettings } from "@/hooks/use-settings"

function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM"
  if (hour < 12) return `${hour}:00 AM`
  if (hour === 12) return "12:00 PM"
  return `${hour - 12}:00 PM`
}

export function ScheduleSettings() {
  const { settings, updateSettings } = useSettings()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-medium mb-1">Schedule</h2>
        <p className="text-sm text-muted-foreground">Configure your calendar preferences.</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Week starts on</label>
        <ButtonGroup>
          <Button
            variant={settings.weekStartsOn === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => updateSettings({ weekStartsOn: 0 })}
          >
            Sunday
          </Button>
          <Button
            variant={settings.weekStartsOn === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => updateSettings({ weekStartsOn: 1 })}
          >
            Monday
          </Button>
        </ButtonGroup>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Day scroll start</label>
        <p className="text-xs text-muted-foreground">The time the calendar scrolls to when you open the day view.</p>
        <Select
          value={String(settings.dayScrollStartHour)}
          onValueChange={(v) => updateSettings({ dayScrollStartHour: Number(v) })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={String(i)}>
                {formatHour(i)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Event refresh interval</label>
        <p className="text-xs text-muted-foreground">How often calendar events are refreshed in the background.</p>
        <Select
          value={String(settings.eventRefreshIntervalMinutes)}
          onValueChange={(v) => updateSettings({ eventRefreshIntervalMinutes: Number(v) as 5 | 10 | 15 | 30 })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Every 5 min</SelectItem>
            <SelectItem value="10">Every 10 min</SelectItem>
            <SelectItem value="15">Every 15 min</SelectItem>
            <SelectItem value="30">Every 30 min</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
