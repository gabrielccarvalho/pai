"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon, Briefcase01Icon } from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"

const navItems = [
  { title: "Home", icon: Home01Icon, href: "/" },
  { title: "Work", icon: Briefcase01Icon, href: "/work" },
]

const user = {
  name: "Gabe",
  email: "gabe@example.com",
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md p-2 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <svg
            className="size-5 shrink-0 rounded"
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="256" height="256" rx="24" fill="#8023FE" />
            <path
              d="M192 80.4197V146.577L185.544 149.48L105.391 184.969L105.235 213.466L83.9585 224L66.6595 214.226L88.6156 204.813V174.478L176.921 136.704V87.8911L105.223 55.8347L105.379 142.248L86.9248 149.982V32.272L192 80.4197ZM80.7694 158.002L154.009 127.362L153.834 98.8515L111.228 80.5513V63.7514L170.766 90.4984V133.384L82.4602 171.158V201.497L64 209.414V40.4233L80.7694 32V158.002Z"
              fill="white"
            />
          </svg>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">pai</span>
            <span className="truncate text-xs text-muted-foreground">
              Personal AI
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.href}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
