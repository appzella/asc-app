'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourSettings } from '@/lib/types'
import { TourCard } from '@/components/tours/TourCard'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Filter } from 'lucide-react'

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
    return <div>Lädt...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/tours" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Zurück zu Touren
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Tourenarchiv</h1>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-800">
          Hier finden Sie alle vergangenen Touren. Das Archiv enthält automatisch alle Touren, deren Datum in der Vergangenheit liegt.
        </p>
      </div>

      {/* Filter */}
      <div className="glass p-3 md:p-6 rounded-xl shadow-modern border border-gray-100/50">
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
                <Filter className="w-4 h-4" strokeWidth={1.8} />
              </Button>
            </div>
          </div>
          
          {/* Ausklappbare Filter auf Mobile */}
          {showFilters && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <div className="space-y-3">
                {user.role === 'admin' && (
                  <Select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: '', label: 'Alle' },
                      { value: 'published', label: 'Veröffentlicht' },
                      { value: 'draft', label: 'Entwurf' },
                      { value: 'cancelled', label: 'Abgesagt' },
                    ]}
                  />
                )}

                <Select
                  label="Tourenart"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Alle' },
                    ...settings.tourTypes.map((type) => ({
                      value: type,
                      label: type,
                    })),
                  ]}
                />

                <Select
                  label="Tourlänge"
                  value={lengthFilter}
                  onChange={(e) => setLengthFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Alle' },
                    ...settings.tourLengths.map((length) => ({
                      value: length,
                      label: length,
                    })),
                  ]}
                />

                <Select
                  label="Schwierigkeit"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Alle' },
                    // T-Skala (Wanderungen)
                    { value: 'T1', label: 'T1 - Wandern' },
                    { value: 'T2', label: 'T2 - Bergwandern' },
                    { value: 'T3', label: 'T3 - Anspruchsvolles Bergwandern' },
                    { value: 'T4', label: 'T4 - Alpinwandern' },
                    { value: 'T5', label: 'T5 - Anspruchsvolles Alpinwandern' },
                    { value: 'T6', label: 'T6 - Schwieriges Alpinwandern' },
                    // SAC-Skala (Skitouren)
                    { value: 'L', label: 'L - Leicht' },
                    { value: 'WS', label: 'WS - Wenig schwierig' },
                    { value: 'ZS', label: 'ZS - Ziemlich schwierig' },
                    { value: 'S', label: 'S - Schwierig' },
                    { value: 'SS', label: 'SS - Sehr schwierig' },
                    { value: 'AS', label: 'AS - Äußerst schwierig' },
                    { value: 'EX', label: 'EX - Extrem schwierig' },
                    // Bike-Skala
                    { value: 'B1', label: 'B1 - Leicht' },
                    { value: 'B2', label: 'B2 - Mittel' },
                    { value: 'B3', label: 'B3 - Schwer' },
                    { value: 'B4', label: 'B4 - Sehr schwierig' },
                    { value: 'B5', label: 'B5 - Extrem' },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showMyTours}
                    onChange={(e) => setShowMyTours(e.target.checked)}
                    className="mr-2"
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
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'Alle' },
                  { value: 'published', label: 'Veröffentlicht' },
                  { value: 'draft', label: 'Entwurf' },
                  { value: 'cancelled', label: 'Abgesagt' },
                ]}
              />
            )}

            <Select
              label="Tourenart"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'Alle' },
                ...settings.tourTypes.map((type) => ({
                  value: type,
                  label: type,
                })),
              ]}
            />

            <Select
              label="Tourlänge"
              value={lengthFilter}
              onChange={(e) => setLengthFilter(e.target.value)}
              options={[
                { value: '', label: 'Alle' },
                ...settings.tourLengths.map((length) => ({
                  value: length,
                  label: length,
                })),
              ]}
            />

            <Select
              label="Schwierigkeit"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              options={[
                { value: '', label: 'Alle' },
                // T-Skala (Wanderungen)
                { value: 'T1', label: 'T1 - Wandern' },
                { value: 'T2', label: 'T2 - Bergwandern' },
                { value: 'T3', label: 'T3 - Anspruchsvolles Bergwandern' },
                { value: 'T4', label: 'T4 - Alpinwandern' },
                { value: 'T5', label: 'T5 - Anspruchsvolles Alpinwandern' },
                { value: 'T6', label: 'T6 - Schwieriges Alpinwandern' },
                // SAC-Skala (Skitouren)
                { value: 'L', label: 'L - Leicht' },
                { value: 'WS', label: 'WS - Wenig schwierig' },
                { value: 'ZS', label: 'ZS - Ziemlich schwierig' },
                { value: 'S', label: 'S - Schwierig' },
                { value: 'SS', label: 'SS - Sehr schwierig' },
                { value: 'AS', label: 'AS - Äußerst schwierig' },
                { value: 'EX', label: 'EX - Extrem schwierig' },
                // Bike-Skala
                { value: 'B1', label: 'B1 - Leicht' },
                { value: 'B2', label: 'B2 - Mittel' },
                { value: 'B3', label: 'B3 - Schwer' },
                { value: 'B4', label: 'B4 - Sehr schwierig' },
                { value: 'B5', label: 'B5 - Extrem' },
              ]}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showMyTours}
                onChange={(e) => setShowMyTours(e.target.checked)}
                className="mr-2"
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
      </div>

      {/* Tour Liste */}
      {filteredTours.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Keine vergangenen Touren gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} tourTypeIcons={settings?.tourTypeIcons} userRole={user?.role} />
          ))}
        </div>
      )}
    </div>
  )
}

