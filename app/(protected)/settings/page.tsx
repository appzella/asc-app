'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SettingsIcon } from '@/components/ui/SettingsIcon'
import { Users, Mail, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser && !canManageUsers(currentUser.role)) {
      router.push('/dashboard')
      return
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  if (!user) {
    return <div>Lädt...</div>
  }

  const settingsCategories: Array<{
    title: string
    description: string
    href: string
    iconType: 'tour-types' | 'tour-lengths' | 'difficulties' | 'users' | 'invitations'
  }> = [
    {
      title: 'Tourentypen',
      description: 'Verwalten Sie die verfügbaren Tourentypen',
      href: '/settings/tour-types',
      iconType: 'tour-types',
    },
    {
      title: 'Tourlängen',
      description: 'Verwalten Sie die verfügbaren Tourlängen',
      href: '/settings/tour-lengths',
      iconType: 'tour-lengths',
    },
    {
      title: 'Schwierigkeitsgrade',
      description: 'Verwalten Sie die Schwierigkeitsgrade für jede Tourenart',
      href: '/settings/difficulties',
      iconType: 'difficulties',
    },
    {
      title: 'Benutzerverwaltung',
      description: 'Verwalten Sie Benutzer, Rollen und Zugriffsrechte',
      href: '/users',
      iconType: 'users',
    },
    {
      title: 'Einladungen',
      description: 'Verwalten Sie Einladungen für neue Benutzer',
      href: '/invitations',
      iconType: 'invitations',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Einstellungen</h1>
        <p className="text-base text-gray-600">Verwalten Sie die Optionen für Touren</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsCategories.map((category) => {
          const isCustomIcon = category.iconType === 'users' || category.iconType === 'invitations'
          const IconComponent = category.iconType === 'users' ? Users : category.iconType === 'invitations' ? Mail : null
          
          return (
            <Link key={category.href} href={category.href} className="touch-manipulation">
              <Card className="hover:shadow-modern-lg active:shadow-modern transition-all cursor-pointer h-full group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {isCustomIcon && IconComponent ? (
                        <IconComponent className="w-10 h-10 stroke-gray-600 group-hover:stroke-primary-600 transition-colors" strokeWidth={1.8} />
                      ) : (
                        <SettingsIcon type={category.iconType as 'tour-types' | 'tour-lengths' | 'difficulties'} className="w-10 h-10 group-hover:stroke-primary-600 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{category.description}</p>
                    </div>
                    <ChevronRight className="w-7 h-7 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" strokeWidth={1.8} />
                  </div>
                </CardContent>
              </Card>
          </Link>
        )
        })}
      </div>
    </div>
  )
}
