'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { Trash2, ChevronLeft } from 'lucide-react'

export default function DifficultiesSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<{ tourTypes: string[]; tourLengths: string[]; difficulties: Record<string, string[]> }>({ tourTypes: [], tourLengths: [], difficulties: {} })
  const [selectedTourType, setSelectedTourType] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [newDifficulty, setNewDifficulty] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser && !canManageUsers(currentUser.role)) {
        router.push('/dashboard')
        return
      }

      if (currentUser) {
        const currentSettings = await dataRepository.getSettings()
        setSettings(currentSettings)
        if (currentSettings.tourTypes.length > 0 && !selectedTourType) {
          setSelectedTourType(currentSettings.tourTypes[0])
        }
      }
    }

    loadSettings()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const currentSettings = await dataRepository.getSettings()
        setSettings(currentSettings)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router, selectedTourType])

  useEffect(() => {
    const loadDifficulties = async () => {
      if (selectedTourType) {
        const diffs = await dataRepository.getDifficultiesForTourType(selectedTourType)
        setDifficulties(diffs)
      }
    }
    loadDifficulties()
  }, [selectedTourType])

  const handleAdd = async () => {
    if (!newDifficulty.trim()) {
      setError('Bitte geben Sie einen Schwierigkeitsgrad ein')
      return
    }

    if (!selectedTourType) {
      setError('Bitte wählen Sie zuerst eine Tourenart')
      return
    }

    const success = await dataRepository.addDifficulty(selectedTourType, newDifficulty.trim())
    if (success) {
      const diffs = await dataRepository.getDifficultiesForTourType(selectedTourType)
      setDifficulties(diffs)
      setNewDifficulty('')
      setSuccess('Schwierigkeitsgrad hinzugefügt!')
      setTimeout(() => setSuccess(''), 3000)
      setError('')
    } else {
      setError('Dieser Schwierigkeitsgrad existiert bereits')
    }
  }

  const handleRemove = async (difficulty: string) => {
    if (!selectedTourType) return

    const success = await dataRepository.removeDifficulty(selectedTourType, difficulty)
    if (success) {
      const diffs = await dataRepository.getDifficultiesForTourType(selectedTourType)
      setDifficulties(diffs)
      setSuccess('Schwierigkeitsgrad entfernt!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', index.toString())
    e.dataTransfer.setData('text/html', index.toString())
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Ignoriere dragLeave wenn wir über ein Child-Element fahren
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return
    }
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
    if (!selectedTourType) return

    const dragIndexStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/html')
    const dragIndex = parseInt(dragIndexStr)
    
    if (isNaN(dragIndex) || dragIndex === dropIndex) return

    const newOrder = [...difficulties]
    const [removed] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, removed)

    await dataRepository.updateDifficultiesOrder(selectedTourType, newOrder)
    setDifficulties(newOrder)
    setSuccess('Reihenfolge aktualisiert!')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Link 
            href="/settings" 
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Zurück zur Übersicht
          </Link>
          <Link 
            href="/settings"
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target bg-gray-50 hover:bg-gray-100"
            aria-label="Zurück zur Übersicht"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schwierigkeitsgrade</h1>
        <p className="text-base text-gray-600">Verwalten Sie die Schwierigkeitsgrade für jede Tourenart</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
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
              <div className="flex flex-col sm:flex-row gap-2">
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
                  className="flex-1"
                />
                <Button onClick={handleAdd} size="sm">Hinzufügen</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schwierigkeitsgrade für {selectedTourType} ({difficulties.length})</CardTitle>
              <p className="text-xs text-gray-600 mt-1">Ziehen Sie die Einträge, um die Reihenfolge zu ändern</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {difficulties.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Keine Schwierigkeitsgrade vorhanden</p>
                ) : (
                  difficulties.map((difficulty, index) => {
                    const isDragOver = dragOverIndex === index
                    
                    return (
                      <div key={difficulty} className="relative">
                        {isDragOver && (
                          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary-400 rounded-full z-10" />
                        )}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={(e) => {
                            if (e.currentTarget instanceof HTMLElement) {
                              e.currentTarget.style.opacity = '1'
                            }
                            setDragOverIndex(null)
                          }}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 cursor-move hover:bg-gray-100 transition-all group relative"
                        >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 text-sm">☰</span>
                        <span className="font-medium text-gray-900 truncate text-sm">{difficulty}</span>
                      </div>
                      <button
                        type="button"
                        draggable={false}
                        onClick={() => handleRemove(difficulty)}
                        onDragStart={(e) => e.stopPropagation()}
                        className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors touch-target"
                        aria-label="Entfernen"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
