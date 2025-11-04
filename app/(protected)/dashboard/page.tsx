'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListChecks, Calendar, Archive, BookOpen, PlusCircle, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [pendingTours, setPendingTours] = useState<Tour[]>([])
  const [archivedTours, setArchivedTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      const loadTours = async () => {
        setIsLoading(true)
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
        
        setIsLoading(false)
      }
      
      loadTours()
    } else {
      setIsLoading(false)
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!user || isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="flex-1">
                  <Skeleton className="h-10 w-16 mb-2" />
                </div>
                <div className="mt-auto pt-4">
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const myTours = tours.filter((t) => 
    t.participants.includes(user.id) || t.leaderId === user.id
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-base text-gray-600">Willkommen zurück, <span className="font-semibold text-gray-900">{user.name}</span>!</p>
      </div>

      {user.role === 'admin' && pendingTours.length > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50/50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">
            {pendingTours.length} Tour{pendingTours.length !== 1 ? 'en' : ''} wartet{pendingTours.length === 1 ? '' : ''} auf Freigabe
          </AlertTitle>
          <AlertDescription className="mt-2">
            <Link href="/tours?status=submitted">
              <Button variant="default" size="sm">Zur Veröffentlichung</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {user.role === 'leader' && pendingTours.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50/50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">
            {pendingTours.length} Ihrer Tour{pendingTours.length !== 1 ? 'en' : ''} wartet{pendingTours.length === 1 ? '' : ''} auf Freigabe
          </AlertTitle>
          <AlertDescription className="mt-2 text-blue-700">
            Ein Admin wird Ihre Tour{pendingTours.length !== 1 ? 'en' : ''} in Kürze prüfen und veröffentlichen.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-600" strokeWidth={2} />
              <span className="text-lg">Meine Touren</span>
            </CardTitle>
            <CardDescription>Angemeldete oder geleitete Touren</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="flex-1">
              <div className="text-3xl font-bold text-primary-600 mb-2">{myTours.length}</div>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/tours?my=true">
                <Button variant="outline" size="sm" className="w-full">
                  Meine Touren öffnen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" strokeWidth={2} />
              <span className="text-lg">Verfügbare Touren</span>
            </CardTitle>
            <CardDescription>Freigegebene Touren</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="flex-1">
              <div className="text-3xl font-bold text-primary-600 mb-2">{tours.length}</div>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/tours">
                <Button variant="outline" size="sm" className="w-full">
                  Alle Touren durchsuchen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary-600" strokeWidth={2} />
              <span className="text-lg">Tourenarchiv</span>
            </CardTitle>
            <CardDescription>Vergangene Touren</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="flex-1">
              <div className="text-3xl font-bold text-primary-600 mb-2">{archivedTours.length}</div>
            </div>
            <div className="mt-auto pt-4">
              <Link href="/tours/archive">
                <Button variant="outline" size="sm" className="w-full">
                  Archiv öffnen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {(user.role === 'admin' || user.role === 'leader') && (
          <Card className="flex flex-col transition-all h-full group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span className="text-lg">Tour erstellen</span>
              </CardTitle>
              <CardDescription>Erstellen Sie eine neue Tour</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="flex-1"></div>
              <div className="mt-auto pt-4">
                <Link href="/tours/create">
                  <Button variant="default" size="sm" className="w-full">
                    Neue Tour
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="flex flex-col transition-all h-full group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" strokeWidth={2} />
              <span className="text-lg">Hilfe</span>
            </CardTitle>
            <CardDescription>Benötigen Sie Hilfe bei der Nutzung der App?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="flex-1"></div>
            <div className="mt-auto pt-4">
              <Link href="/help">
                <Button variant="outline" size="sm" className="w-full">
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

