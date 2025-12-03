'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { canManageUsers } from '@/lib/roles'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SettingsIcon } from '@/components/ui/SettingsIcon'
import { Users, Mail, ChevronRight, Settings } from 'lucide-react'
import { ContentLayout } from '@/components/admin-panel/content-layout'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUserAsync()

      if (!isMounted) return

      if (!currentUser || !canManageUsers(currentUser.role)) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      setIsLoading(false)
    }

    checkAuth()

    const unsubscribe = authService.subscribe((updatedUser) => {
      if (!isMounted) return

      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
        return
      }
      setUser(updatedUser)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [router])

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const settingsCategories = [
    {
      title: 'Tourentypen',
      description: 'Verwalte die verfügbaren Tourentypen und ihre Icons.',
      href: '/settings/tour-types',
      iconType: 'tour-types',
    },
    {
      title: 'Tourlängen',
      description: 'Definiere die Kategorien für Tourlängen.',
      href: '/settings/tour-lengths',
      iconType: 'tour-lengths',
    },
    {
      title: 'Schwierigkeitsgrade',
      description: 'Konfiguriere Schwierigkeitsskalen für verschiedene Tourenarten.',
      href: '/settings/difficulties',
      iconType: 'difficulties',
    },
    {
      title: 'Benutzerverwaltung',
      description: 'Verwalte Benutzer, Rollen und Zugriffsrechte.',
      href: '/users',
      iconType: 'users',
    },
    {
      title: 'Einladungen',
      description: 'Erstelle und verwalte Einladungen für neue Mitglieder.',
      href: '/invitations',
      iconType: 'invitations',
    },
  ]

  return (
    <ContentLayout
      title="Einstellungen"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Einstellungen</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground">
            Verwalte globale Einstellungen und Konfigurationen für die Anwendung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category) => {
            const isCustomIcon = category.iconType === 'users' || category.iconType === 'invitations'
            const IconComponent = category.iconType === 'users' ? Users : category.iconType === 'invitations' ? Mail : null

            return (
              <Link key={category.href} href={category.href} className="block h-full">
                <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {isCustomIcon && IconComponent ? (
                          <IconComponent className="w-5 h-5 text-primary" />
                        ) : (
                          <SettingsIcon
                            type={category.iconType as 'tour-types' | 'tour-lengths' | 'difficulties'}
                            className="w-5 h-5 text-primary"
                          />
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </ContentLayout>
  )
}
