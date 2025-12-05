"use client"

import { usePathname } from "next/navigation"

import { ModeToggle } from "@/components/mode-toggle"
import { NotificationCenter } from "@/components/notification-center"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter((segment) => segment !== "")

  // Determine Section Title
  let sectionTitle = "Dashboard"
  if (segments.length > 0 && segments[0] !== "dashboard") {
    sectionTitle = segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    // Map common paths to German titles if needed
    if (sectionTitle === "Tours") sectionTitle = "Touren"
    if (sectionTitle === "Users") sectionTitle = "Mitglieder"
    if (sectionTitle === "Settings") sectionTitle = "Einstellungen"
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{sectionTitle}</h1>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`
              const isLast = index === segments.length - 1
              let title = segment.charAt(0).toUpperCase() + segment.slice(1)

              // Simple localization for breadcrumbs too
              if (title === "Tours") title = "Touren"
              if (title === "Create") title = "Erstellen"
              if (title === "Users") title = "Mitglieder"

              return (
                <div key={href} className="flex items-center">
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-1">
            <NotificationCenter />
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
