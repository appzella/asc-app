'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ChevronRight, ListChecks, Calendar, Archive, BookOpen } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [pendingTours, setPendingTours] = useState<Tour[]>([])
  const [archivedTours, setArchivedTours] = useState<Tour[]>([])

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      const loadTours = async () => {
        const allTours = await dataRepository.getTours()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Zukünftige Touren (published oder cancelled - beide sollen sichtbar sein)
        const futureTours = allTours.filter((t) => {
          const tourDate = new Date(t.date)
          tourDate.setHours(0, 0, 0, 0)
          return tourDate >= today && (t.status === 'published' || t.status === 'cancelled')
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
          const submitted = await dataRepository.getToursSubmittedForPublishing()
          setPendingTours(submitted)
        } else if (currentUser.role === 'leader') {
          const allTours = await dataRepository.getTours()
          const submitted = allTours.filter((t) => t.leaderId === currentUser.id && t.status === 'draft' && t.submittedForPublishing === true)
          setPendingTours(submitted)
        }
      }
      
      loadTours()
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
            <Link href="/tours?status=submitted">
              <Button variant="primary">Zur Veröffentlichung</Button>
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
        <Card className="flex flex-col hover:shadow-modern-lg transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span>Meine Touren</span>
              </div>
              <Link href="/tours?my=true" className="sm:hidden touch-manipulation">
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" strokeWidth={1.8} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <Link href="/tours?my=true" className="sm:hidden touch-manipulation block flex-1">
              <div className="text-3xl font-bold text-primary-600">{myTours.length}</div>
              <p className="text-sm text-gray-600 mt-2">Angemeldete oder geleitete Touren</p>
            </Link>
            <div className="sm:block hidden">
              <div className="text-3xl font-bold text-primary-600">{myTours.length}</div>
              <p className="text-sm text-gray-600 mt-2">Angemeldete oder geleitete Touren</p>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/tours?my=true" className="hidden sm:block">
                <Button variant="outline" size="sm" className="w-full shadow-sm">
                  Meine Touren öffnen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col hover:shadow-modern-lg transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span>Verfügbare Touren</span>
              </div>
              <Link href="/tours" className="sm:hidden touch-manipulation">
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" strokeWidth={1.8} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <Link href="/tours" className="sm:hidden touch-manipulation block flex-1">
              <div className="text-3xl font-bold text-primary-600">{tours.length}</div>
              <p className="text-sm text-gray-600 mt-2">Freigegebene Touren</p>
            </Link>
            <div className="sm:block hidden">
              <div className="text-3xl font-bold text-primary-600">{tours.length}</div>
              <p className="text-sm text-gray-600 mt-2">Freigegebene Touren</p>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/tours" className="hidden sm:block">
                <Button variant="outline" size="sm" className="w-full shadow-sm">
                  Alle Touren durchsuchen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col hover:shadow-modern-lg transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span>Tourenarchiv</span>
              </div>
              <Link href="/tours/archive" className="sm:hidden touch-manipulation">
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" strokeWidth={1.8} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <Link href="/tours/archive" className="sm:hidden touch-manipulation block flex-1">
              <div className="text-3xl font-bold text-primary-600">{archivedTours.length}</div>
              <p className="text-sm text-gray-600 mt-2">Vergangene Touren</p>
            </Link>
            <div className="sm:block hidden">
              <div className="text-3xl font-bold text-primary-600">{archivedTours.length}</div>
              <p className="text-sm text-gray-600 mt-2">Vergangene Touren</p>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/tours/archive" className="hidden sm:block">
                <Button variant="outline" size="sm" className="w-full shadow-sm">
                  Archiv öffnen
                </Button>
              </Link>
            </div>
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

        <Card className="flex flex-col hover:shadow-modern-lg transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span>Hilfe</span>
              </div>
              <Link href="/help" className="sm:hidden touch-manipulation">
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" strokeWidth={1.8} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <Link href="/help" className="sm:hidden touch-manipulation block flex-1">
              <p className="text-sm text-gray-600 text-center">Benötigen Sie Hilfe bei der Nutzung der App</p>
            </Link>
            <div className="sm:block hidden">
              <p className="text-sm text-gray-600 text-center">Benötigen Sie Hilfe bei der Nutzung der App</p>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/help" className="hidden sm:block">
                <Button variant="outline" size="sm" className="w-full shadow-sm">
                  Hilfe öffnen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

