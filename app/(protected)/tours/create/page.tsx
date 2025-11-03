'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, TourType, TourLength, Difficulty, TourSettings, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { canCreateTour } from '@/lib/roles'
import { getDifficultyOptions } from '@/lib/difficulty'
import { getTourIcon, getTourIconColor } from '@/lib/tourIcons'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function CreateTourPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<TourSettings>({ tourTypes: [], tourLengths: [], difficulties: {} })
  const [users, setUsers] = useState<User[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [creationMode, setCreationMode] = useState<'new' | 'duplicate'>('new')
  const [selectedTourId, setSelectedTourId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showResults, setShowResults] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [resultsPosition, setResultsPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  
  // Update position when showing results
  useEffect(() => {
    if (showResults && searchQuery && searchInputRef.current) {
      const updatePosition = () => {
        if (searchInputRef.current) {
          const rect = searchInputRef.current.getBoundingClientRect()
          setResultsPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          })
        }
      }
      
      updatePosition()
      
      // Only update on scroll/resize, not continuously
      const handleUpdate = () => updatePosition()
      
      window.addEventListener('scroll', handleUpdate, { passive: true, capture: true })
      window.addEventListener('resize', handleUpdate)
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, { capture: true } as any)
        window.removeEventListener('resize', handleUpdate)
      }
    } else {
      setResultsPosition(null)
    }
  }, [showResults, searchQuery])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    difficulty: '' as Difficulty | '',
    tourType: '' as TourType | '',
    tourLength: '' as TourLength | '',
    elevation: '',
    duration: '',
    maxParticipants: '',
    leaderId: '',
  })

  useEffect(() => {
    const loadData = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const tourSettings = await dataRepository.getSettings()
        setSettings(tourSettings)
        
        // Load tours for duplication
        const allTours = await dataRepository.getTours()
        // Sort by date descending (newest first)
        allTours.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setTours(allTours)
        
        // Load users for leader selection (only for admins)
        if (currentUser.role === 'admin') {
          const allUsers = await dataRepository.getUsers()
          // Filter to only show leaders and admins as potential tour leaders
          const leaders = allUsers.filter(u => u.role === 'leader' || u.role === 'admin')
          setUsers(leaders)
          // Set default leader to current user
          setFormData(prev => ({ ...prev, leaderId: currentUser.id }))
        } else {
          // For non-admins, set leaderId to current user
          setFormData(prev => ({ ...prev, leaderId: currentUser.id }))
        }
        
        if (!canCreateTour(currentUser.role)) {
          router.push('/tours')
        }
      }
    }

    loadData()

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canCreateTour(updatedUser.role)) {
        router.push('/tours')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  // Handle tour duplication
  const handleDuplicateTour = (tourId: string) => {
    const tourToDuplicate = tours.find(t => t.id === tourId)
    if (!tourToDuplicate) return

    // Set minimum date to today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tourDate = new Date(tourToDuplicate.date)
    tourDate.setHours(0, 0, 0, 0)
    const minDate = tourDate < today ? today : tourDate

    setFormData({
      title: `${tourToDuplicate.title} (Kopie)`,
      description: tourToDuplicate.description,
      date: minDate.toISOString().split('T')[0],
      difficulty: tourToDuplicate.difficulty,
      tourType: tourToDuplicate.tourType,
      tourLength: tourToDuplicate.tourLength,
      elevation: tourToDuplicate.elevation.toString(),
      duration: tourToDuplicate.duration.toString(),
      maxParticipants: tourToDuplicate.maxParticipants.toString(),
      leaderId: user?.role === 'admin' ? tourToDuplicate.leaderId : (user?.id || ''),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) return

    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.date ||
      !formData.difficulty ||
      !formData.tourType ||
      !formData.tourLength ||
      !formData.elevation ||
      !formData.duration ||
      !formData.maxParticipants ||
      (user.role === 'admin' && !formData.leaderId)
    ) {
      setError('Bitte füllen Sie alle Felder aus')
      return
    }

    setIsLoading(true)

    try {
      // For leaders, always use their own ID as leaderId
      const finalLeaderId = user.role === 'admin' ? formData.leaderId : user.id
      
      const tour = await dataRepository.createTour({
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date),
        difficulty: formData.difficulty as Difficulty,
        tourType: formData.tourType as TourType,
        tourLength: formData.tourLength as TourLength,
        elevation: parseInt(formData.elevation),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants),
        leaderId: finalLeaderId,
        createdBy: user.id,
      })

      router.push(`/tours/${tour.id}`)
    } catch (err) {
      console.error('Error creating tour:', err)
      setError('Fehler beim Erstellen der Tour')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Link 
            href="/tours" 
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Zurück zur Übersicht
          </Link>
          <Link 
            href="/tours"
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target bg-gray-50 hover:bg-gray-100"
            aria-label="Zurück zur Übersicht"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Neue Tour erstellen</h1>
      </div>

      <Card className="relative" style={{ overflow: 'visible', zIndex: 200 }}>
        <CardHeader>
          <CardTitle>Erstellungsmodus</CardTitle>
        </CardHeader>
        <CardContent style={{ overflow: 'visible' }}>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={creationMode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCreationMode('new')
                setSelectedTourId('')
                setSearchQuery('')
                setShowResults(false)
                // Reset form
                setFormData({
                  title: '',
                  description: '',
                  date: '',
                  difficulty: '' as Difficulty | '',
                  tourType: '' as TourType | '',
                  tourLength: '' as TourLength | '',
                  elevation: '',
                  duration: '',
                  maxParticipants: '',
                  leaderId: user?.role === 'admin' ? (formData.leaderId || user.id) : (user?.id || ''),
                })
              }}
              className="flex-1"
            >
              Neue Tour erstellen
            </Button>
            <Button
              type="button"
              variant={creationMode === 'duplicate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreationMode('duplicate')}
              className="flex-1"
            >
              Tour duplizieren
            </Button>
          </div>

          {creationMode === 'duplicate' && (
            <div className="space-y-3">
              <div className="w-full flex flex-col relative" style={{ zIndex: 300 }}>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tour suchen
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowResults(true)
                  }}
                  onFocus={() => setShowResults(true)}
                  onBlur={() => {
                    // Delay to allow click on result
                    setTimeout(() => setShowResults(false), 200)
                  }}
                  placeholder="Titel der Tour eingeben..."
                  className="w-full px-4 py-2.5 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 border-gray-300 hover:border-gray-400 min-h-[44px]"
                />
              </div>
              {selectedTourId && (
                <p className="text-xs text-primary-600">
                  ✓ Tour ausgewählt. Felder wurden automatisch ausgefüllt.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trefferliste außerhalb der Cards mit fixed positioning */}
      {showResults && searchQuery && resultsPosition && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-[9999]"
          style={{
            top: `${resultsPosition.top}px`,
            left: `${resultsPosition.left}px`,
            width: `${resultsPosition.width}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {tours
            .filter((tour) => {
              if (!searchQuery.trim()) return false
              return tour.title.toLowerCase().includes(searchQuery.toLowerCase())
            })
            .slice(0, 10)
            .map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => {
                  setSelectedTourId(tour.id)
                  setSearchQuery(tour.title)
                  setShowResults(false)
                  handleDuplicateTour(tour.id)
                }}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-200 last:border-b-0 focus:outline-none focus:bg-primary-50 flex items-center gap-3 touch-target"
              >
                {(() => {
                  const IconComponent = getTourIcon(tour.tourType, settings.tourTypeIcons)
                  const iconColor = getTourIconColor(tour.tourType)
                  return <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0`} strokeWidth={2} />
                })()}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{tour.title}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(tour.date).toLocaleDateString('de-CH')} · {tour.tourType}
                  </div>
                </div>
              </button>
            ))}
          {tours.filter((tour) => 
            tour.title.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Keine Touren gefunden, die "{searchQuery}" enthalten.
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tour-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Titel</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="z.B. Skitour auf den Säntis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Beschreibung</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Beschreiben Sie die Tour..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="create-date">Datum</Label>
                <Input
                  id="create-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-tour-type">Tourenart</Label>
                <Select
                  value={formData.tourType}
                  onValueChange={(value) => {
                    const newTourType = value as TourType
                    // Schwierigkeit zurücksetzen, wenn Tourenart geändert wird
                    setFormData({ ...formData, tourType: newTourType, difficulty: '' })
                  }}
                  required
                >
                  <SelectTrigger id="create-tour-type" className="w-full">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.tourTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-tour-length">Tourlänge</Label>
                <Select
                  value={formData.tourLength}
                  onValueChange={(value) => setFormData({ ...formData, tourLength: value as TourLength })}
                  required
                >
                  <SelectTrigger id="create-tour-length" className="w-full">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.tourLengths.map((length) => (
                      <SelectItem key={length} value={length}>
                        {length}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-difficulty">Schwierigkeit (SAC-Skala)</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value as Difficulty })}
                  required
                  disabled={!formData.tourType}
                >
                  <SelectTrigger id="create-difficulty" className="w-full">
                    <SelectValue placeholder={formData.tourType ? "Bitte wählen" : "Bitte zuerst Tourenart wählen"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getDifficultyOptions(formData.tourType).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-elevation">Höhenmeter</Label>
                <Input
                  id="create-elevation"
                  type="number"
                  value={formData.elevation}
                  onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-duration">Dauer (Stunden)</Label>
                <Input
                  id="create-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-max-participants">Max. Teilnehmer</Label>
                <Input
                  id="create-max-participants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  required
                  min="1"
                />
              </div>
              
              {user?.role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="create-leader">Tourenleiter</Label>
                  <Select
                    value={formData.leaderId}
                    onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
                    required
                  >
                    <SelectTrigger id="create-leader" className="w-full">
                      <SelectValue placeholder="Bitte wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" variant="default" disabled={isLoading} className="flex-1">
                {isLoading ? 'Wird erstellt...' : 'Tour erstellen'}
              </Button>
              <Link href="/tours" className="flex-1 sm:flex-initial">
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                  Abbrechen
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
