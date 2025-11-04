'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, TourSettings } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { getIconByName, getTourIcon } from '@/lib/tourIcons'
import { Trash2, ChevronDown, ChevronLeft } from 'lucide-react'

export default function TourTypesSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tourTypes, setTourTypes] = useState<string[]>([])
  const [tourTypeIcons, setTourTypeIcons] = useState<{ [key: string]: string }>({})
  const [newType, setNewType] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openIconPicker, setOpenIconPicker] = useState<string | null>(null)
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
        const settings = await dataRepository.getSettings()
        setTourTypes(settings.tourTypes)
        setTourTypeIcons(settings.tourTypeIcons || {})
      }
    }

    loadSettings()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const settings = await dataRepository.getSettings()
        setTourTypes(settings.tourTypes)
        setTourTypeIcons(settings.tourTypeIcons || {})
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  const handleAdd = async () => {
    if (!newType.trim()) {
      setError('Bitte gib einen Tourentyp ein')
      return
    }

    const success = await dataRepository.addTourType(newType.trim())
    if (success) {
      const settings = await dataRepository.getSettings()
      setTourTypes(settings.tourTypes)
      setTourTypeIcons(settings.tourTypeIcons || {})
      setNewType('')
      setSuccess('Tourentyp hinzugefügt!')
      setTimeout(() => setSuccess(''), 3000)
      setError('')
    } else {
      setError('Dieser Tourentyp existiert bereits')
    }
  }

  const handleRemove = async (type: string) => {
    const success = await dataRepository.removeTourType(type)
    if (success) {
      const settings = await dataRepository.getSettings()
      setTourTypes(settings.tourTypes)
      setTourTypeIcons(settings.tourTypeIcons || {})
      setSuccess('Tourentyp entfernt!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleIconChange = async (tourType: string, iconName: string) => {
    const success = await dataRepository.updateTourTypeIcon(tourType, iconName)
    if (success) {
      setTourTypeIcons({ ...tourTypeIcons, [tourType]: iconName })
      setSuccess(`Icon für ${tourType} aktualisiert!`)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Fehler beim Aktualisieren des Icons')
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', index.toString())
    // Setze auch text/html als Fallback für ältere Browser
    e.dataTransfer.setData('text/html', index.toString())
    // Setze Opacity für besseres visuelles Feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    // Nur updaten wenn sich der Index wirklich ändert
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
    
    const dragIndexStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/html')
    const dragIndex = parseInt(dragIndexStr)
    
    if (isNaN(dragIndex) || dragIndex === dropIndex) return

    const newOrder = [...tourTypes]
    const [removed] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, removed)

    await dataRepository.updateTourTypesOrder(newOrder)
    setTourTypes(newOrder)
    setSuccess('Reihenfolge aktualisiert!')
    setTimeout(() => setSuccess(''), 3000)
  }

  // Beliebte Icons für Tourenarten (nur existierende lucide-react Icons)
  // Icons werden zur Laufzeit gefiltert, um nur existierende anzuzeigen
  const popularIcons = [
    { value: 'Mountain', label: 'Mountain' },
    { value: 'Footprints', label: 'Footprints' },
    { value: 'Snowflake', label: 'Snowflake' },
    { value: 'Bike', label: 'Bike' },
    { value: 'MapPin', label: 'MapPin' },
    { value: 'Compass', label: 'Compass' },
    { value: 'Trees', label: 'Trees' },
    { value: 'TreePine', label: 'TreePine' },
    { value: 'Route', label: 'Route' },
    { value: 'Navigation', label: 'Navigation' },
    { value: 'Map', label: 'Map' },
    { value: 'Award', label: 'Award' },
    { value: 'Target', label: 'Target' },
    { value: 'Flag', label: 'Flag' },
    { value: 'Tent', label: 'Tent' },
    { value: 'MountainSnow', label: 'MountainSnow' },
    { value: 'MapPinned', label: 'MapPinned' },
    { value: 'Landmark', label: 'Landmark' },
  ]

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            <Link href="/settings">
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tourentypen</h1>
        <CardDescription className="text-base">Verwalte die verfügbaren Tourentypen</CardDescription>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Neuen Tourentyp hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newType}
              onChange={(e) => {
                setNewType(e.target.value)
                setError('')
              }}
              placeholder="z.B. Klettern"
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
          <CardTitle>Tourentypen ({tourTypes.length})</CardTitle>
          <CardDescription>Ziehe die Einträge, um die Reihenfolge zu ändern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tourTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Keine Tourentypen vorhanden</p>
            ) : (
              tourTypes.map((type, index) => {
                const currentIconName = tourTypeIcons[type] || 'Mountain'
                const CurrentIconComponent = getTourIcon(type as any, tourTypeIcons)
                const isPickerOpen = openIconPicker === type
                const isDragOver = dragOverIndex === index
                
                return (
                  <div key={type} className="relative">
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
                      className="flex items-center justify-between gap-3 p-3 bg-muted rounded-md border border-border cursor-move hover:bg-muted transition-all group relative"
                    >
                    <span className="text-muted-foreground group-hover:text-muted-foreground flex-shrink-0 text-sm">☰</span>
                    <div className="relative flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        draggable={false}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenIconPicker(isPickerOpen ? null : type)
                        }}
                        onDragStart={(e) => e.stopPropagation()}
                        className="h-auto p-1.5 gap-1"
                      >
                        <CurrentIconComponent className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                      </Button>
                      {isPickerOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenIconPicker(null)}
                          />
                          <div className="absolute top-full left-0 mt-2 z-20 bg-background rounded-md shadow-lg border border-border p-2 grid grid-cols-4 gap-2 w-64 max-h-64 overflow-y-auto">
                            {popularIcons
                              .filter((iconOption, index, self) => {
                                // Entferne Duplikate basierend auf value
                                const firstIndex = self.findIndex(i => i.value === iconOption.value)
                                if (firstIndex !== index) return false
                                
                                // Prüfe, ob Icon wirklich existiert
                                try {
                                  const testIcon = getIconByName(iconOption.value)
                                  // Wenn das Icon nicht existiert, gibt getIconByName das Mountain Fallback zurück
                                  // Prüfe, ob es wirklich existiert, indem wir testen ob es ein anderes Icon zurückgibt als bei einem ungültigen Namen
                                  const fallbackTest = getIconByName('NonExistentIcon12345')
                                  // Wenn beide gleich sind (beide Mountain), dann existiert das Icon nicht wirklich
                                  return testIcon !== fallbackTest || iconOption.value === 'Mountain'
                                } catch {
                                  return false
                                }
                              })
                              .map((iconOption) => {
                                const IconOptionComponent = getIconByName(iconOption.value)
                                const isSelected = iconOption.value === currentIconName
                                return (
                                  <button
                                    key={iconOption.value}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleIconChange(type, iconOption.value)
                                      setOpenIconPicker(null)
                                    }}
                                    className={`flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors touch-target ${
                                      isSelected ? 'bg-primary-50 border border-primary-500' : 'border border-transparent'
                                    }`}
                                  >
                                    <IconOptionComponent 
                                      className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-muted-foreground'}`} 
                                      strokeWidth={2} 
                                    />
                                  </button>
                                )
                              })}
                          </div>
                        </>
                      )}
                    </div>
                    <span className="font-medium text-foreground flex-1 min-w-0 truncate text-sm">{type}</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      draggable={false}
                      onClick={() => handleRemove(type)}
                      onDragStart={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                      aria-label="Entfernen"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
