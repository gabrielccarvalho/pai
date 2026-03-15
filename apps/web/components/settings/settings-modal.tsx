"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Sun03Icon,
  Link01Icon,
  Calendar03Icon,
  TaskDaily01Icon,
  CheckListIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { AppearanceSettings } from "./sections/appearance-settings"
import { ConnectionsSettings } from "./sections/connections-settings"
import { ScheduleSettings } from "./sections/schedule-settings"
import { TodosSettings } from "./sections/todos-settings"
import { TasksSettings } from "./sections/tasks-settings"

type Section = "appearance" | "connections" | "schedule" | "todos" | "tasks"

const sections: {
  id: Section
  label: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
}[] = [
  { id: "appearance", label: "Appearance", icon: Sun03Icon },
  { id: "connections", label: "Connections", icon: Link01Icon },
  { id: "schedule", label: "Schedule", icon: Calendar03Icon },
  { id: "todos", label: "Todos", icon: TaskDaily01Icon },
  { id: "tasks", label: "Tasks", icon: CheckListIcon },
]

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}

export function SettingsModal({
  open,
  onOpenChange,
  userEmail,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<Section>("appearance")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0"
        style={{ width: "60vw", maxWidth: "60vw", height: "60vh" }}
        showCloseButton={false}
      >
        <div className="flex h-full">
          {/* Left sidebar */}
          <nav className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/30">
            <div className="border-b border-border px-4 py-4">
              <DialogTitle className="text-sm font-semibold">
                Settings
              </DialogTitle>
            </div>
            <div className="flex-1 flex flex-col gap-0.5 p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    activeSection === section.id
                      ? "bg-background font-medium text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={section.icon}
                    strokeWidth={2}
                    className="size-4 shrink-0"
                  />
                  {section.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right content */}
          <div className="h-full w-full flex-1 overflow-y-auto">
            <div className="p-6 pr-8">
              {activeSection === "appearance" && <AppearanceSettings />}
              {activeSection === "connections" && (
                <ConnectionsSettings userEmail={userEmail} />
              )}
              {activeSection === "schedule" && <ScheduleSettings />}
              {activeSection === "todos" && <TodosSettings />}
              {activeSection === "tasks" && <TasksSettings />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
