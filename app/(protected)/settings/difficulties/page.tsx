'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataStore } from '@/lib/data/mockData'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'

export default function DifficultiesSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState(dataStore.getSettings())
  const [selectedTourType, setSelectedTourType] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [newDifficulty, setNewDifficulty] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser && !canManageUsers(currentUser.role)) {
      router.push('/dashboard')
      return
    }

    if (currentUser) {
      const currentSettings = dataStore.getSettings()
      setSettings(currentSettings)
      if (currentSettings.tourTypes.length > 0 && !selectedTourType) {
        setSelectedTourType(currentSettings.tourTypes[0])
      }
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const currentSettings = dataStore.getSettings()
        setSettings(currentSettings)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router, selectedTourType])

  useEffect(() => {
    if (selectedTourType) {
      const diffs = dataStore.getDifficultiesForTourType(selectedTourType)
      setDifficulties(diffs)
    }
  }, [selectedTourType])

  const handleAdd = () => {
    if (!newDifficulty.trim()) {
      setError('Bitte geben Sie einen Schwierigkeitsgrad ein')
      return
    }

    if (!selectedTourType) {
      setError('Bitte wählen Sie zuerst eine Tourenart')
      return
    }

    const success = dataStore.addDifficulty(selectedTourType, newDifficulty.trim())
    if (success) {
      setDifficulties(dataStore.getDifficultiesForTourType(selectedTourType))
      setNewDifficulty('')
      setSuccess('Schwierigkeitsgrad hinzugefügt!')
      setTimeout(() => setSuccess(''), 3000)
      setError('')
    } else {
      setError('Dieser Schwierigkeitsgrad existiert bereits')
    }
  }

  const handleRemove = (difficulty: string) => {
    if (!selectedTourType) return

    const success = dataStore.removeDifficulty(selectedTourType, difficulty)
    if (success) {
      setDifficulties(dataStore.getDifficultiesForTourType(selectedTourType))
      setSuccess('Schwierigkeitsgrad entfernt!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!selectedTourType) return

    const dragIndex = parseInt(e.dataTransfer.getData('text/html'))
    
    if (dragIndex === dropIndex) return

    const newOrder = [...difficulties]
    const [removed] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, removed)

    dataStore.updateDifficultiesOrder(selectedTourType, newOrder)
    setDifficulties(newOrder)
    setSuccess('Reihenfolge aktualisiert!')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!user) {
    return <div>Lädt...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Link href="/settings" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Schwierigkeitsgrade</h1>
        <p className="text-lg text-gray-600">Verwalten Sie die Schwierigkeitsgrade für jede Tourenart</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tourenart auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            label="Tourenart"
            value={selectedTourType}
            onChange={(e) => {
              setSelectedTourType(e.target.value)
              setNewDifficulty('')
              setError('')
            }}
            options={[
              { value: '', label: 'Bitte wählen' },
              ...settings.tourTypes.map((type) => ({
                value: type,
                label: type,
              })),
            ]}
          />
        </CardContent>
      </Card>

      {selectedTourType && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Neuen Schwierigkeitsgrad hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-end">
                <Input
                  value={newDifficulty}
                  onChange={(e) => {
                    setNewDifficulty(e.target.value)
                    setError('')
                  }}
                  placeholder="z.B. T1, L, B1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAdd()
                    }
                  }}
                />
                <Button onClick={handleAdd}>Hinzufügen</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schwierigkeitsgrade für {selectedTourType} ({difficulties.length})</CardTitle>
              <p className="text-sm text-gray-600 mt-2">Ziehen Sie die Einträge, um die Reihenfolge zu ändern</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {difficulties.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Schwierigkeitsgrade vorhanden</p>
                ) : (
                  difficulties.map((difficulty, index) => (
                    <div
                      key={difficulty}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 group-hover:text-gray-600">☰</span>
                        <span className="font-medium text-gray-900">{difficulty}</span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemove(difficulty)}
                      >
                        Entfernen
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
