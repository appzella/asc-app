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

import { authService } from "@/lib/auth"

// Keep static navigation data outside
const navData = {
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
      title: "Konfiguration",
      url: "/admin/tour-types",
      icon: SettingsIcon,
      items: [
        {
          title: "Tourenarten",
          url: "/admin/tour-types",
        },
        {
          title: "Tourenlängen",
          url: "/admin/tour-lengths",
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
  const [user, setUser] = React.useState({
    name: "Laden...",
    email: "",
    avatar: "/avatars/placeholder.png",
  })


  React.useEffect(() => {
    // Helper to format user data
    const formatUser = (u: any) => {
      const roleMap: Record<string, string> = {
        admin: "Admin",
        leader: "Tourenleiter",
        member: "Mitglied",
      }
      return {
        name: u.name || "Benutzer",
        email: roleMap[u.role] || u.role || "",
        avatar: u.profilePhoto || "/avatars/placeholder.png",
      }
    }

    // Initial fetch
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(formatUser(currentUser))
    }

    // Subscribe to changes
    const unsubscribe = authService.subscribe((u) => {
      if (u) {
        setUser(formatUser(u))
      }
    })

    return () => unsubscribe()
  }, [])


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
        <NavMain items={navData.navMain} />
        <NavAdmin items={navData.navAdmin} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
