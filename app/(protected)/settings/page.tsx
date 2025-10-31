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

  const settingsCategories = [
    {
      title: 'Tourentypen',
      description: 'Verwalten Sie die verfügbaren Tourentypen',
      href: '/settings/tour-types',
      iconType: 'tour-types' as const,
    },
    {
      title: 'Tourlängen',
      description: 'Verwalten Sie die verfügbaren Tourlängen',
      href: '/settings/tour-lengths',
      iconType: 'tour-lengths' as const,
    },
    {
      title: 'Schwierigkeitsgrade',
      description: 'Verwalten Sie die Schwierigkeitsgrade für jede Tourenart',
      href: '/settings/difficulties',
      iconType: 'difficulties' as const,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Einstellungen</h1>
        <p className="text-base text-gray-600">Verwalten Sie die Optionen für Touren</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsCategories.map((category) => (
          <Link key={category.href} href={category.href} className="touch-manipulation">
            <Card className="hover:shadow-modern-lg active:shadow-modern transition-all cursor-pointer h-full group">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <SettingsIcon type={category.iconType} className="w-10 h-10 group-hover:stroke-primary-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{category.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Verwalten →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
