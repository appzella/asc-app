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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ListChecks,
  Calendar,
  Archive,
  BookOpen,
  PlusCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Map as MapIcon,
  ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ContentLayout } from '@/components/admin-panel/content-layout'

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

        // Zukünftige Touren
        const futureTours = allTours.filter((t) => {
          const tourDate = new Date(t.date)
          tourDate.setHours(0, 0, 0, 0)
          return tourDate >= today && (t.status === 'published' || t.status === 'cancelled')
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setTours(futureTours)

        // Vergangene Touren
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
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  const myTours = tours.filter((t) =>
    t.participants.includes(user.id) || t.leaderId === user.id
  )

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-4">
        <div className="flex items-center justify-end space-y-2">
          <div className="flex items-center space-x-2">
            {(user.role === 'admin' || user.role === 'leader') && (
              <Link href="/tours/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Neue Tour
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Alerts for Pending Tours */}
        {(user.role === 'admin' || user.role === 'leader') && pendingTours.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Freigabe erforderlich</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {pendingTours.length} Tour{pendingTours.length !== 1 ? 'en' : ''} wartet{pendingTours.length === 1 ? '' : ''} auf Freigabe.
              </span>
              <Link href="/tours?status=submitted">
                <Button variant="outline" size="sm" className="ml-4 border-yellow-500/50 hover:bg-yellow-500/20">
                  Ansehen
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meine Touren</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTours.length}</div>
              <p className="text-xs text-muted-foreground">
                Angemeldet oder geleitet
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kommende Touren</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tours.length}</div>
              <p className="text-xs text-muted-foreground">
                Insgesamt verfügbar
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archiv</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{archivedTours.length}</div>
              <p className="text-xs text-muted-foreground">
                Vergangene Touren
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivität</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2</div>
              <p className="text-xs text-muted-foreground">
                Neue Touren diese Woche
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tours Table */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Nächste Touren</CardTitle>
              <CardDescription>
                Die nächsten 5 anstehenden Touren im Verein.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tours.slice(0, 5).map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell className="font-medium">
                        <Link href={`/tours/${tour.id}`} className="hover:underline">
                          {tour.title}
                        </Link>
                      </TableCell>
                      <TableCell>{new Date(tour.date).toLocaleDateString('de-CH')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tour.tourType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {tour.status === 'cancelled' ? (
                          <Badge variant="destructive">Abgesagt</Badge>
                        ) : (
                          <Badge variant="secondary">Geplant</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tours.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Keine kommenden Touren gefunden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Links / Info */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Schnellzugriff</CardTitle>
              <CardDescription>
                Häufig genutzte Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link href="/tours">
                <div className="flex items-center justify-between space-x-4 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <div className="flex items-center space-x-4">
                    <MapIcon className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-none">Tourenübersicht</p>
                      <p className="text-sm text-muted-foreground">Alle Touren anzeigen</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/profile">
                <div className="flex items-center justify-between space-x-4 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <div className="flex items-center space-x-4">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-none">Mein Profil</p>
                      <p className="text-sm text-muted-foreground">Einstellungen verwalten</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/help">
                <div className="flex items-center justify-between space-x-4 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <div className="flex items-center space-x-4">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-none">Hilfe & FAQ</p>
                      <p className="text-sm text-muted-foreground">Anleitungen lesen</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentLayout>
  )
}
