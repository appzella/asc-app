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
import { Card, CardContent } from '@/components/ui/card'
import { Filter, ChevronLeft } from 'lucide-react'

export default function ToursArchivePage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [filteredTours, setFilteredTours] = useState<Tour[]>([])
  const [settings, setSettings] = useState<TourSettings>({ tourTypes: [], tourLengths: [], difficulties: {} })
  
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
    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter)
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

    // Sortierung nach Datum (neueste zuerst - absteigend)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Link 
              href="/tours" 
              className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zu Touren
            </Link>
            <Link 
              href="/tours"
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target bg-gray-50 hover:bg-gray-100"
              aria-label="Zurück zu Touren"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tourenarchiv</h1>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-800">
          Hier finden Sie alle vergangenen Touren. Das Archiv enthält automatisch alle Touren, deren Datum in der Vergangenheit liegt.
        </p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent>
          {/* Mobile: Kompakte Suchzeile mit Filter-Toggle */}
          <div className="md:hidden space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Suche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="flex flex-col">
                <div className="h-5 mb-1"></div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-shrink-0 flex items-center justify-center px-3 h-[3rem]"
                  aria-label={showFilters ? 'Filter schließen' : 'Filter anzeigen'}
                >
                  <Filter className="w-4 h-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          
          {/* Ausklappbare Filter auf Mobile */}
          {showFilters && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="space-y-3">
                {user.role === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="filter-status-mobile">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="filter-status-mobile" className="w-full">
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Alle</SelectItem>
                        <SelectItem value="published">Veröffentlicht</SelectItem>
                        <SelectItem value="draft">Entwurf</SelectItem>
                        <SelectItem value="cancelled">Abgesagt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="filter-type-mobile">Tourenart</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="filter-type-mobile" className="w-full">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle</SelectItem>
                      {settings.tourTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-length-mobile">Tourlänge</Label>
                  <Select value={lengthFilter} onValueChange={setLengthFilter}>
                    <SelectTrigger id="filter-length-mobile" className="w-full">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle</SelectItem>
                      {settings.tourLengths.map((length) => (
                        <SelectItem key={length} value={length}>
                          {length}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-difficulty-mobile">Schwierigkeit</Label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger id="filter-difficulty-mobile" className="w-full">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle</SelectItem>
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

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showMyTours}
                    onChange={(e) => setShowMyTours(e.target.checked)}
                    className="mr-2 w-4 h-4 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Nur meine Touren</span>
                </label>
                
                {(statusFilter || typeFilter || lengthFilter || difficultyFilter || searchQuery || showMyTours) && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Normale Ansicht */}
        <div className="hidden md:block space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Suche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {user.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="filter-status-desktop">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="filter-status-desktop" className="w-full">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
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
                  <SelectItem value="">Alle</SelectItem>
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
                  <SelectItem value="">Alle</SelectItem>
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
                  <SelectItem value="">Alle</SelectItem>
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

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showMyTours}
                onChange={(e) => setShowMyTours(e.target.checked)}
                className="mr-2 w-4 h-4 focus:ring-primary-500 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Nur meine Touren</span>
            </label>
            
            {(statusFilter || typeFilter || lengthFilter || difficultyFilter || searchQuery || showMyTours) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      </Card>

      {/* Tour Liste */}
      {filteredTours.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-base text-gray-600">Keine vergangenen Touren gefunden.</p>
              <p className="text-sm text-gray-500 mt-2">Alle zukünftigen Touren finden Sie in der <Link href="/tours" className="text-primary-600 hover:text-primary-700 underline">Tourenübersicht</Link>.</p>
            </div>
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

