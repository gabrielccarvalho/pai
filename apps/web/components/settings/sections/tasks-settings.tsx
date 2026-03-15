"use client"

import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { useSettings } from "@/hooks/use-settings"

export function TasksSettings() {
  const { settings, updateSettings } = useSettings()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-medium mb-1">Tasks</h2>
        <p className="text-sm text-muted-foreground">Configure your task board defaults.</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Default view</label>
        <p className="text-xs text-muted-foreground">The view shown when you open the tasks page.</p>
        <ButtonGroup>
          <Button
            variant={settings.taskDefaultView === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => updateSettings({ taskDefaultView: "table" })}
          >
            Table
          </Button>
          <Button
            variant={settings.taskDefaultView === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => updateSettings({ taskDefaultView: "kanban" })}
          >
            Kanban
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}
