"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { dataRepository } from "@/lib/data"

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
  const [tourTitles, setTourTitles] = useState<Record<string, string>>({})

  // Determine Section Title
  let sectionTitle = "Dashboard"
  if (segments.length > 0 && segments[0] !== "dashboard") {
    sectionTitle = segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    // Map common paths to German titles if needed
    if (sectionTitle === "Tours") sectionTitle = "Touren"
    if (sectionTitle === "Users") sectionTitle = "Mitglieder"
    if (sectionTitle === "Settings") sectionTitle = "Einstellungen"
    if (sectionTitle === "Profile") sectionTitle = "Profil"
  }

  useEffect(() => {
    const fetchTourTitles = async () => {
      const newTitles: Record<string, string> = {}
      let hasUpdates = false

      for (const segment of segments) {
        if (segment.toLowerCase().startsWith("tour_") && !tourTitles[segment]) {
          try {
            const tour = await dataRepository.getTourById(segment)
            if (tour) {
              if (tour.peak && tour.peakElevation) {
                newTitles[segment] = `${tour.peak} ${tour.peakElevation} m`
              } else {
                newTitles[segment] = tour.title
              }
              hasUpdates = true
            }
          } catch (error) {
            console.error("Failed to fetch tour title for breadcrumb", error)
          }
        }
      }

      if (hasUpdates) {
        setTourTitles(prev => ({ ...prev, ...newTitles }))
      }
    }

    fetchTourTitles()
  }, [pathname, segments, tourTitles]) // tourTitles dependency to avoid loops? No, check condition ensures no loop.

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

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
              if (title === "Profile") title = "Profil"
              if (title === "Settings") title = "Einstellungen"
              if (title === "Invitations") title = "Einladungen"
              if (title === "Archive") title = "Archiv"
              if (title === "Tour-types") title = "Tourenarten"
              if (title === "Tour-lengths") title = "Tourenlängen"
              if (title === "Difficulties") title = "Schwierigkeitsgrade"
              if (title === "Edit") title = "Bearbeiten"
              if (title === "Admin") title = "Verwaltung"

              // Handle tour IDs
              if (segment.toLowerCase().startsWith("tour_")) {
                title = tourTitles[segment] || "Details"
              }

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
        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
