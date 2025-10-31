'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataStore } from '@/lib/data/mockData'
import { User, Tour, TourType, TourLength, Difficulty } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { canEditTour } from '@/lib/roles'
import { getDifficultyOptions } from '@/lib/difficulty'
import Link from 'next/link'

export default function EditTourPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [settings, setSettings] = useState(dataStore.getSettings())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setSettings(dataStore.getSettings())

    if (currentUser) {
      const tourData = dataStore.getTourById(tourId)
      if (!tourData) {
        router.push('/tours')
        return
      }

      if (!canEditTour(currentUser.role, tourData.leaderId, currentUser.id)) {
        router.push(`/tours/${tourId}`)
        return
      }

      setTour(tourData)
      
      // Formular mit aktuellen Tour-Daten füllen
      const displayTour = tourData.pendingChanges ? { ...tourData, ...tourData.pendingChanges } : tourData
      setFormData({
        title: displayTour.title,
        description: displayTour.description,
        date: new Date(displayTour.date).toISOString().split('T')[0],
        difficulty: displayTour.difficulty,
        tourType: displayTour.tourType,
        tourLength: displayTour.tourLength,
        elevation: displayTour.elevation.toString(),
        duration: displayTour.duration.toString(),
        maxParticipants: displayTour.maxParticipants.toString(),
      })
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [tourId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user || !tour) return

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
      !formData.maxParticipants
    ) {
      setError('Bitte füllen Sie alle Felder aus')
      return
    }

    setIsLoading(true)

    try {
      const updates = {
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date),
        difficulty: formData.difficulty as Difficulty,
        tourType: formData.tourType as TourType,
        tourLength: formData.tourLength as TourLength,
        elevation: parseInt(formData.elevation),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants),
      }

      // Wenn Tour bereits approved ist, werden Änderungen als pendingChanges gespeichert
      const submitForApproval = tour.status === 'approved'
      dataStore.updateTour(tourId, updates, submitForApproval)

      router.push(`/tours/${tourId}`)
    } catch (err) {
      setError('Fehler beim Aktualisieren der Tour')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !tour) {
    return <div>Lädt...</div>
  }

  const hasPendingChanges = tour.pendingChanges !== undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/tours/${tourId}`} className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
          ← Zurück zur Tour
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tour bearbeiten</h1>
      </div>

      {hasPendingChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              Diese Tour hat bereits ausstehende Änderungen, die auf Freigabe warten.
              Neue Änderungen werden zu den bestehenden hinzugefügt.
            </p>
          </CardContent>
        </Card>
      )}

      {tour.status === 'approved' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-blue-800">
              Diese Tour ist bereits freigegeben. Ihre Änderungen müssen vom Admin genehmigt werden,
              bevor sie live gehen.
            </p>
          </CardContent>
        </Card>
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
            />

            <Textarea
              label="Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
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
                onChange={(e) => setFormData({ ...formData, tourType: e.target.value as TourType })}
                required
                options={settings.tourTypes.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />

              <Select
                label="Tourlänge"
                value={formData.tourLength}
                onChange={(e) => setFormData({ ...formData, tourLength: e.target.value as TourLength })}
                required
                options={settings.tourLengths.map((length) => ({
                  value: length,
                  label: length,
                }))}
              />

              <Select
                label="Schwierigkeit (SAC-Skala)"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                required
                options={getDifficultyOptions(formData.tourType).map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
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
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
                {isLoading ? 'Wird gespeichert...' : tour.status === 'approved' ? 'Änderungen zur Freigabe einreichen' : 'Tour aktualisieren'}
              </Button>
              <Link href={`/tours/${tourId}`}>
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

