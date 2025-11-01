'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, TourType, TourLength, Difficulty, TourSettings } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { canCreateTour } from '@/lib/roles'
import { getDifficultyOptions } from '@/lib/difficulty'
import Link from 'next/link'

export default function CreateTourPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<TourSettings>({ tourTypes: [], tourLengths: [], difficulties: {} })
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
    const loadData = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const tourSettings = await dataRepository.getSettings()
        setSettings(tourSettings)
        
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
      !formData.maxParticipants
    ) {
      setError('Bitte füllen Sie alle Felder aus')
      return
    }

    setIsLoading(true)

    try {
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
        leaderId: user.id,
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
        <Link href="/tours" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Neue Tour erstellen</h1>
      </div>

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
