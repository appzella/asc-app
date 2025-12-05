"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  MapIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavAdmin } from "@/components/nav-admin"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Pascal Staub",
    email: "Admin",
    avatar: "/avatars/pascal-staub.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Touren",
      url: "/tours",
      icon: MapIcon,
      items: [
        {
          title: "Aktuell",
          url: "/tours",
        },
        {
          title: "Archiv",
          url: "/tours/archive",
        },
        {
          title: "Erstellen",
          url: "/tours/create",
        },
      ],
    },
    {
      title: "Mitglieder",
      url: "/users",
      icon: UsersIcon,
    },
  ],
  navAdmin: [
    {
      title: "Einstellungen",
      url: "/settings",
      icon: SettingsIcon,
      items: [
        {
          title: "Allgemein",
          url: "/settings",
        },
        {
          title: "Tourenarten",
          url: "/admin/tour-types",
        },
        {
          title: "Tourenlängen",
          url: "/admin/tour-lengths",
        },
        {
          title: "Schwierigkeitsgrade",
          url: "/admin/difficulties",
        },
      ],
    },
    {
      title: "Benutzer",
      url: "/admin/users",
      icon: UsersIcon,
      items: [
        {
          title: "Liste",
          url: "/admin/users",
        },
        {
          title: "Einladungen",
          url: "/admin/invitations",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Hilfe",
      url: "/help",
      icon: HelpCircleIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">ASC St. Gallen</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAdmin items={data.navAdmin} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
