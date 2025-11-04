'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourSettings } from '@/lib/types'
import { TourCard } from '@/components/tours/TourCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Filter, ChevronLeft } from 'lucide-react'

export default function ToursArchivePage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [filteredTours, setFilteredTours] = useState<Tour[]>([])
  const [settings, setSettings] = useState<TourSettings>({ tourTypes: [], tourLengths: [], difficulties: {} })
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [lengthFilter, setLengthFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showMyTours, setShowMyTours] = useState<boolean>(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      const loadData = async () => {
        const tourSettings = await dataRepository.getSettings()
        setSettings(tourSettings)
        
        let allTours = await dataRepository.getTours()
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Nur vergangene Touren anzeigen
        allTours = allTours.filter((t) => {
          const tourDate = new Date(t.date)
          tourDate.setHours(0, 0, 0, 0)
          return tourDate < today
        })

        // URL-Parameter prüfen
        const myParam = searchParams.get('my')
        
        if (myParam === 'true') {
          setShowMyTours(true)
        }

        setTours(allTours)
        setFilteredTours(allTours)
      }
      
      loadData()
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [searchParams])

  useEffect(() => {
    let filtered = [...tours]

    // Meine Touren Filter
    if (showMyTours && user) {
      filtered = filtered.filter((t) => 
        t.participants.includes(user.id) || t.leaderId === user.id
      )
    }

    // Status Filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Typ Filter
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.tourType === typeFilter)
    }

    // Länge Filter
    if (lengthFilter && lengthFilter !== 'all') {
      filtered = filtered.filter((t) => t.tourLength === lengthFilter)
    }

    // Schwierigkeit Filter
    if (difficultyFilter && difficultyFilter !== 'all') {
      filtered = filtered.filter((t) => t.difficulty === difficultyFilter)
    }

    // Suchfilter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.leader?.name.toLowerCase().includes(query)
      )
    }

    // Sortierung nach Datum (neueste zuerst - absteigend)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    setFilteredTours(filtered)
  }, [tours, statusFilter, typeFilter, lengthFilter, difficultyFilter, searchQuery, showMyTours, user])

  const clearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setLengthFilter('all')
    setDifficultyFilter('all')
    setSearchQuery('')
    setShowMyTours(false)
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
            >
              <Link href="/tours">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                Zurück zu Touren
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tourenarchiv</h1>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Hier finden Sie alle vergangenen Touren. Das Archiv enthält automatisch alle Touren, deren Datum in der Vergangenheit liegt.
        </AlertDescription>
      </Alert>

      {/* Mobile: Suchzeile mit Filter-Drawer */}
      <div className="md:hidden flex gap-2">
        <Input
          placeholder="Suche..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Filter className="w-4 h-4" strokeWidth={1.8} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filter</SheetTitle>
              <SheetDescription>
                Filtern Sie die Touren nach Ihren Wünschen
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {user.role === 'admin' && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="published">Veröffentlicht</SelectItem>
                      <SelectItem value="draft">Entwurf</SelectItem>
                      <SelectItem value="cancelled">Abgesagt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Tourenart</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {settings.tourTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tourlänge</Label>
                <Select value={lengthFilter} onValueChange={setLengthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {settings.tourLengths.map((length) => (
                      <SelectItem key={length} value={length}>
                        {length}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schwierigkeit</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="T1">T1 - Wandern</SelectItem>
                    <SelectItem value="T2">T2 - Bergwandern</SelectItem>
                    <SelectItem value="T3">T3 - Anspruchsvolles Bergwandern</SelectItem>
                    <SelectItem value="T4">T4 - Alpinwandern</SelectItem>
                    <SelectItem value="T5">T5 - Anspruchsvolles Alpinwandern</SelectItem>
                    <SelectItem value="T6">T6 - Schwieriges Alpinwandern</SelectItem>
                    <SelectItem value="L">L - Leicht</SelectItem>
                    <SelectItem value="WS">WS - Wenig schwierig</SelectItem>
                    <SelectItem value="ZS">ZS - Ziemlich schwierig</SelectItem>
                    <SelectItem value="S">S - Schwierig</SelectItem>
                    <SelectItem value="SS">SS - Sehr schwierig</SelectItem>
                    <SelectItem value="AS">AS - Äußerst schwierig</SelectItem>
                    <SelectItem value="EX">EX - Extrem schwierig</SelectItem>
                    <SelectItem value="B1">B1 - Leicht</SelectItem>
                    <SelectItem value="B2">B2 - Mittel</SelectItem>
                    <SelectItem value="B3">B3 - Schwer</SelectItem>
                    <SelectItem value="B4">B4 - Sehr schwierig</SelectItem>
                    <SelectItem value="B5">B5 - Extrem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="my-tours-archive-sheet"
                    checked={showMyTours}
                    onCheckedChange={setShowMyTours}
                  />
                  <Label htmlFor="my-tours-archive-sheet" className="text-sm font-medium cursor-pointer">
                    Nur meine Touren
                  </Label>
                </div>
              </div>

              {(statusFilter !== 'all' || typeFilter !== 'all' || lengthFilter !== 'all' || difficultyFilter !== 'all' || searchQuery || showMyTours) && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Filter Card */}
      <Card className="hidden md:block">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter</CardTitle>
            {(statusFilter !== 'all' || typeFilter !== 'all' || lengthFilter !== 'all' || difficultyFilter !== 'all' || searchQuery || showMyTours) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                Zurücksetzen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Suche</Label>
              <Input
                placeholder="Suche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {user.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="filter-status-desktop">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="filter-status-desktop" className="w-full">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="published">Veröffentlicht</SelectItem>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="cancelled">Abgesagt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="filter-type-desktop">Tourenart</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="filter-type-desktop" className="w-full">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {settings.tourTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-length-desktop">Tourlänge</Label>
              <Select value={lengthFilter} onValueChange={setLengthFilter}>
                <SelectTrigger id="filter-length-desktop" className="w-full">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {settings.tourLengths.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-difficulty-desktop">Schwierigkeit</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger id="filter-difficulty-desktop" className="w-full">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="T1">T1 - Wandern</SelectItem>
                  <SelectItem value="T2">T2 - Bergwandern</SelectItem>
                  <SelectItem value="T3">T3 - Anspruchsvolles Bergwandern</SelectItem>
                  <SelectItem value="T4">T4 - Alpinwandern</SelectItem>
                  <SelectItem value="T5">T5 - Anspruchsvolles Alpinwandern</SelectItem>
                  <SelectItem value="T6">T6 - Schwieriges Alpinwandern</SelectItem>
                  <SelectItem value="L">L - Leicht</SelectItem>
                  <SelectItem value="WS">WS - Wenig schwierig</SelectItem>
                  <SelectItem value="ZS">ZS - Ziemlich schwierig</SelectItem>
                  <SelectItem value="S">S - Schwierig</SelectItem>
                  <SelectItem value="SS">SS - Sehr schwierig</SelectItem>
                  <SelectItem value="AS">AS - Äußerst schwierig</SelectItem>
                  <SelectItem value="EX">EX - Extrem schwierig</SelectItem>
                  <SelectItem value="B1">B1 - Leicht</SelectItem>
                  <SelectItem value="B2">B2 - Mittel</SelectItem>
                  <SelectItem value="B3">B3 - Schwer</SelectItem>
                  <SelectItem value="B4">B4 - Sehr schwierig</SelectItem>
                  <SelectItem value="B5">B5 - Extrem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <Switch
              id="my-tours-archive-desktop"
              checked={showMyTours}
              onCheckedChange={setShowMyTours}
            />
            <Label htmlFor="my-tours-archive-desktop" className="text-sm font-medium cursor-pointer">
              Nur meine Touren
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Tour Liste */}
      {filteredTours.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 text-base">Keine vergangenen Touren gefunden.</p>
            <CardDescription className="mt-2">
              Alle zukünftigen Touren finden Sie in der{' '}
              <Link href="/tours" className="text-primary-600 hover:text-primary-700 underline">
                Tourenübersicht
              </Link>
              .
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} tourTypeIcons={settings?.tourTypeIcons} userRole={user?.role} />
          ))}
        </div>
      )}
    </div>
  )
}

