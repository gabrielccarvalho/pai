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

export function TodosSettings() {
  const { settings, updateSettings } = useSettings()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-medium mb-1">Todos</h2>
        <p className="text-sm text-muted-foreground">Configure your todo list defaults.</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Default date window</label>
        <p className="text-xs text-muted-foreground">The default time window shown when you open the todo list.</p>
        <ButtonGroup>
          <Button
            variant={settings.todoDefaultWindow === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => updateSettings({ todoDefaultWindow: "today" })}
          >
            Today
          </Button>
          <Button
            variant={settings.todoDefaultWindow === "this-week" ? "default" : "outline"}
            size="sm"
            onClick={() => updateSettings({ todoDefaultWindow: "this-week" })}
          >
            This Week
          </Button>
        </ButtonGroup>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Default sort</label>
        <Select
          value={settings.todoDefaultSort}
          onValueChange={(v) => updateSettings({ todoDefaultSort: v as typeof settings.todoDefaultSort })}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due-asc">Due date (oldest first)</SelectItem>
            <SelectItem value="due-desc">Due date (newest first)</SelectItem>
            <SelectItem value="completion">Completion %</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
