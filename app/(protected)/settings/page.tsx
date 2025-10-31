'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

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
      icon: '🏔️',
    },
    {
      title: 'Tourlängen',
      description: 'Verwalten Sie die verfügbaren Tourlängen',
      href: '/settings/tour-lengths',
      icon: '📅',
    },
    {
      title: 'Schwierigkeitsgrade',
      description: 'Verwalten Sie die Schwierigkeitsgrade für jede Tourenart',
      href: '/settings/difficulties',
      icon: '⚡',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Einstellungen</h1>
        <p className="text-lg text-gray-600">Verwalten Sie die Optionen für Touren</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className="hover:shadow-modern-lg transition-all cursor-pointer h-full group">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Verwalten →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
