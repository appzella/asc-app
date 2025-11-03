'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourType, TourLength, Difficulty, TourSettings } from '@/lib/types'
import { TourCard } from '@/components/tours/TourCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Archive, Filter } from 'lucide-react'

export default function ToursPage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [filteredTours, setFilteredTours] = useState<Tour[]>([])
  const [settings, setSettings] = useState<TourSettings | null>(null)
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [lengthFilter, setLengthFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showMyTours, setShowMyTours] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState<boolean>(false)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      const loadData = async () => {
        const tourSettings = await dataRepository.getSettings()
        setSettings(tourSettings)
        
        let allTours = await dataRepository.getTours()
        
        // URL-Parameter prüfen
        const statusParam = searchParams.get('status')
        const myParam = searchParams.get('my')
        
        if (statusParam === 'submitted' && currentUser.role === 'admin') {
          allTours = await dataRepository.getToursSubmittedForPublishing()
          setStatusFilter('submitted')
        } else if (statusParam === 'submitted' && currentUser.role === 'leader') {
          allTours = allTours.filter((t) => t.leaderId === currentUser.id && t.status === 'draft' && t.submittedForPublishing === true)
          setStatusFilter('submitted')
        } else if (statusParam === 'draft' && currentUser.role === 'admin') {
          allTours = await dataRepository.getDraftTours()
          setStatusFilter('draft')
        } else if (currentUser.role !== 'admin' && currentUser.role !== 'leader') {
          // Mitglieder sehen veröffentlichte und abgesagte Touren
          allTours = allTours.filter((t) => t.status === 'published' || t.status === 'cancelled')
        } else if (currentUser.role === 'leader') {
          // Leaders sehen ihre eigenen Entwürfe, veröffentlichte und abgesagte Touren
          allTours = allTours.filter((t) => 
            t.status === 'published' || 
            t.status === 'cancelled' || 
            (t.status === 'draft' && t.leaderId === currentUser.id)
          )
        }

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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Nur zukünftige Touren anzeigen (Archiv hat eigene Seite)
    filtered = filtered.filter((t) => {
      const tourDate = new Date(t.date)
      tourDate.setHours(0, 0, 0, 0)
      return tourDate >= today
    })

    // Meine Touren Filter
    if (showMyTours && user) {
      filtered = filtered.filter((t) => 
        t.participants.includes(user.id) || t.leaderId === user.id
      )
    }

    // Status Filter
    if (statusFilter) {
      if (statusFilter === 'published') {
        filtered = filtered.filter((t) => t.status === 'published')
      } else if (statusFilter === 'draft') {
        filtered = filtered.filter((t) => t.status === 'draft')
      } else if (statusFilter === 'cancelled') {
        filtered = filtered.filter((t) => t.status === 'cancelled')
      } else if (statusFilter === 'submitted') {
        filtered = filtered.filter((t) => t.status === 'draft' && t.submittedForPublishing === true)
      }
    }

    // Typ Filter
    if (typeFilter) {
      filtered = filtered.filter((t) => t.tourType === typeFilter)
    }

    // Länge Filter
    if (lengthFilter) {
      filtered = filtered.filter((t) => t.tourLength === lengthFilter)
    }

    // Schwierigkeit Filter
    if (difficultyFilter) {
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

    // Sortierung nach Datum (nächste Tour zuerst)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

    setFilteredTours(filtered)
  }, [tours, statusFilter, typeFilter, lengthFilter, difficultyFilter, searchQuery, showMyTours, user])

  const clearFilters = () => {
    setStatusFilter('')
    setTypeFilter('')
    setLengthFilter('')
    setDifficultyFilter('')
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

  if (!settings) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Touren</h1>
          <Link href="/tours/archive">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Archive className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Archiv</span>
            </Button>
          </Link>
        </div>
        {(user.role === 'admin' || user.role === 'leader') && (
          <Link href="/tours/create">
            <Button size="sm">Neue Tour erstellen</Button>
          </Link>
        )}
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter</CardTitle>
            {(statusFilter || typeFilter || lengthFilter || difficultyFilter || searchQuery || showMyTours) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                Zurücksetzen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile: Kompakte Suchzeile mit Filter-Toggle */}
          <div className="md:hidden space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Suche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0"
                aria-label={showFilters ? 'Filter schließen' : 'Filter anzeigen'}
              >
                <Filter className="w-4 h-4" strokeWidth={1.8} />
              </Button>
            </div>
            
            {/* Ausklappbare Filter auf Mobile */}
            {showFilters && (
              <div className="space-y-4 pt-2 border-t">
                {user.role === 'admin' && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="published">Veröffentlicht</SelectItem>
                        <SelectItem value="draft">Entwurf</SelectItem>
                        <SelectItem value="cancelled">Abgesagt</SelectItem>
                        <SelectItem value="submitted">Zur Veröffentlichung eingereicht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Tourenart</Label>
                  <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      {settings.tourTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tourlänge</Label>
                  <Select value={lengthFilter || "all"} onValueChange={(value) => setLengthFilter(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      {settings.tourLengths.map((length) => (
                        <SelectItem key={length} value={length}>{length}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Schwierigkeit</Label>
                  <Select value={difficultyFilter || "all"} onValueChange={(value) => setDifficultyFilter(value === "all" ? "" : value)}>
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

                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="my-tours-mobile"
                    checked={showMyTours}
                    onCheckedChange={setShowMyTours}
                  />
                  <Label htmlFor="my-tours-mobile" className="text-sm font-medium cursor-pointer">
                    Nur meine Touren
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Normale Ansicht */}
          <div className="hidden md:block space-y-4">
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
                  <Label>Status</Label>
                  <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="published">Veröffentlicht</SelectItem>
                      <SelectItem value="draft">Entwurf</SelectItem>
                      <SelectItem value="cancelled">Abgesagt</SelectItem>
                      <SelectItem value="submitted">Zur Veröffentlichung eingereicht</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Tourenart</Label>
                <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {settings.tourTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tourlänge</Label>
                <Select value={lengthFilter || "all"} onValueChange={(value) => setLengthFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {settings.tourLengths.map((length) => (
                      <SelectItem key={length} value={length}>{length}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schwierigkeit</Label>
                <Select value={difficultyFilter || "all"} onValueChange={(value) => setDifficultyFilter(value === "all" ? "" : value)}>
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
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Switch
                id="my-tours-desktop"
                checked={showMyTours}
                onCheckedChange={setShowMyTours}
              />
              <Label htmlFor="my-tours-desktop" className="text-sm font-medium cursor-pointer">
                Nur meine Touren
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tour Liste */}
      {filteredTours.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 text-base">Keine Touren gefunden.</p>
            <CardDescription className="mt-2">Versuchen Sie es mit anderen Filtern.</CardDescription>
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

