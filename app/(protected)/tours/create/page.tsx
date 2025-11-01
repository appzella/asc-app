'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, TourType, TourLength, Difficulty, TourSettings, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
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
    return <div>Lädt...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Link 
            href="/tours" 
            className="hidden sm:inline-block text-primary-600 hover:text-primary-700 text-sm mb-2"
          >
            ← Zurück zur Übersicht
          </Link>
          <Link 
            href="/tours"
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 touch-manipulation bg-primary-100 hover:bg-primary-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
            aria-label="Zurück zur Übersicht"
          >
            <ChevronLeft className="w-5 h-5 text-primary-700" strokeWidth={1.8} />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Neue Tour erstellen</h1>
      </div>

      <Card className="relative" style={{ overflow: 'visible', zIndex: 200 }}>
        <CardHeader>
          <CardTitle>Erstellungsmodus</CardTitle>
        </CardHeader>
        <CardContent style={{ overflow: 'visible' }}>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                creationMode === 'new'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Neue Tour erstellen
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('duplicate')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                creationMode === 'duplicate'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tour duplizieren
            </button>
          </div>

          {creationMode === 'duplicate' && (
            <div className="space-y-2">
              <div className="w-full flex flex-col relative" style={{ zIndex: 300 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-3 border rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md border-gray-200 hover:border-gray-300"
                />
              </div>
              {selectedTourId && (
                <p className="text-sm text-primary-600 mt-2">
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
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[9999]"
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
                className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-primary-50 flex items-center gap-3"
              >
                {(() => {
                  const IconComponent = getTourIcon(tour.tourType, settings.tourTypeIcons)
                  const iconColor = getTourIconColor(tour.tourType)
                  return <IconComponent className={`w-5 h-5 ${iconColor} flex-shrink-0`} strokeWidth={2} />
                })()}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{tour.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(tour.date).toLocaleDateString('de-CH')} · {tour.tourType}
                  </div>
                </div>
              </button>
            ))}
          {tours.filter((tour) => 
            tour.title.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
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
            <Input
              label="Titel"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="z.B. Skitour auf den Säntis"
            />

            <Textarea
              label="Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Beschreiben Sie die Tour..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Datum"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />

              <Select
                label="Tourenart"
                value={formData.tourType}
                onChange={(e) => {
                  const newTourType = e.target.value as TourType
                  // Schwierigkeit zurücksetzen, wenn Tourenart geändert wird
                  setFormData({ ...formData, tourType: newTourType, difficulty: '' })
                }}
                required
                options={[
                  { value: '', label: 'Bitte wählen' },
                  ...settings.tourTypes.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
              />

              <Select
                label="Tourlänge"
                value={formData.tourLength}
                onChange={(e) => setFormData({ ...formData, tourLength: e.target.value as TourLength })}
                required
                options={[
                  { value: '', label: 'Bitte wählen' },
                  ...settings.tourLengths.map((length) => ({
                    value: length,
                    label: length,
                  })),
                ]}
              />

              <Select
                label="Schwierigkeit (SAC-Skala)"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                required
                options={[
                  { value: '', label: 'Bitte zuerst Tourenart wählen' },
                  ...getDifficultyOptions(formData.tourType).map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })),
                ]}
                disabled={!formData.tourType}
              />

              <Input
                label="Höhenmeter"
                type="number"
                value={formData.elevation}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                required
                min="0"
              />

              <Input
                label="Dauer (Stunden)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                min="1"
              />

              <Input
                label="Max. Teilnehmer"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                required
                min="1"
              />
              
              {user?.role === 'admin' && (
                <Select
                  label="Tourenleiter"
                  value={formData.leaderId}
                  onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                  required
                  options={[
                    { value: '', label: 'Bitte wählen' },
                    ...users.map((u) => ({
                      value: u.id,
                      label: `${u.name} (${u.role})`,
                    })),
                  ]}
                />
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
                {isLoading ? 'Wird erstellt...' : 'Tour erstellen'}
              </Button>
              <Link href="/tours">
                <Button type="button" variant="outline">
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
