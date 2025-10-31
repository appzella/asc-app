'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth'
import { dataStore } from '@/lib/data/mockData'
import { User, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [pendingTours, setPendingTours] = useState<Tour[]>([])
  const [archivedTours, setArchivedTours] = useState<Tour[]>([])

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      const allTours = dataStore.getTours()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Zukünftige Touren
      const futureTours = allTours.filter((t) => {
        const tourDate = new Date(t.date)
        tourDate.setHours(0, 0, 0, 0)
        return tourDate >= today && t.status === 'approved'
      })
      setTours(futureTours)
      
      // Vergangene Touren (Archiv)
      const pastTours = allTours.filter((t) => {
        const tourDate = new Date(t.date)
        tourDate.setHours(0, 0, 0, 0)
        return tourDate < today
      })
      setArchivedTours(pastTours)
      
      if (currentUser.role === 'admin') {
        setPendingTours(dataStore.getPendingTours())
      } else if (currentUser.role === 'leader') {
        setPendingTours(allTours.filter((t) => t.leaderId === currentUser.id && t.status === 'pending'))
      }
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!user) {
    return <div>Lädt...</div>
  }

  const myTours = tours.filter((t) => 
    t.participants.includes(user.id) || t.leaderId === user.id
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-lg text-gray-600">Willkommen zurück, <span className="font-semibold text-gray-900">{user.name}</span>!</p>
      </div>

      {user.role === 'admin' && pendingTours.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              {pendingTours.length} Tour{pendingTours.length !== 1 ? 'en' : ''} wartet{pendingTours.length === 1 ? '' : ''} auf Freigabe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/tours?status=pending">
              <Button variant="primary">Zur Freigabe</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {user.role === 'leader' && pendingTours.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              {pendingTours.length} Ihrer Tour{pendingTours.length !== 1 ? 'en' : ''} wartet{pendingTours.length === 1 ? '' : ''} auf Freigabe
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Meine Touren</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-3xl font-bold text-primary-600">{myTours.length}</div>
            <p className="text-sm text-gray-600 mt-2">Angemeldete oder geleitete Touren</p>
            <Link href="/tours?my=true" className="mt-auto pt-4">
              <Button variant="outline" size="sm" className="w-full">
                Anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Verfügbare Touren</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-3xl font-bold text-primary-600">{tours.length}</div>
            <p className="text-sm text-gray-600 mt-2">Freigegebene Touren</p>
            <Link href="/tours" className="mt-auto pt-4">
              <Button variant="outline" size="sm" className="w-full">
                Anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Tourenarchiv</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-3xl font-bold text-primary-600">{archivedTours.length}</div>
            <p className="text-sm text-gray-600 mt-2">Vergangene Touren</p>
            <Link href="/tours/archive" className="mt-auto pt-4">
              <Button variant="outline" size="sm" className="w-full">
                Archiv öffnen
              </Button>
            </Link>
          </CardContent>
        </Card>

        {(user.role === 'admin' || user.role === 'leader') && (
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Tour erstellen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mt-2">Erstellen Sie eine neue Tour</p>
              </div>
              <Link href="/tours/create" className="mt-auto pt-4">
                <Button variant="primary" size="sm" className="w-full">
                  Neue Tour
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

