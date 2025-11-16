'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { Trash2, ChevronLeft, SquarePen, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export default function TourLengthsSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tourLengths, setTourLengths] = useState<string[]>([])
  const [newLength, setNewLength] = useState('')
  const [error, setError] = useState('')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingLength, setEditingLength] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

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
        setTourLengths(settings.tourLengths)
      }
    }

    loadSettings()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const settings = await dataRepository.getSettings()
        setTourLengths(settings.tourLengths)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  const handleAdd = async () => {
    if (!newLength.trim()) {
      toast.error('Bitte gib eine Tourlänge ein')
      return
    }

    const success = await dataRepository.addTourLength(newLength.trim())
    if (success) {
      const settings = await dataRepository.getSettings()
      setTourLengths(settings.tourLengths)
      setNewLength('')
      toast.success('Tourlänge hinzugefügt!')
      setError('')
    } else {
      toast.error('Diese Tourlänge existiert bereits')
    }
  }

  const handleRemove = async (length: string) => {
    const success = await dataRepository.removeTourLength(length)
    if (success) {
      const settings = await dataRepository.getSettings()
      setTourLengths(settings.tourLengths)
      toast.success('Tourlänge entfernt!')
    }
  }

  const handleStartEdit = (length: string) => {
    setEditingLength(length)
    setEditValue(length)
  }

  const handleCancelEdit = () => {
    setEditingLength(null)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!editingLength || !editValue.trim()) {
      toast.error('Bitte gib einen Namen ein')
      return
    }

    if (editValue.trim() === editingLength) {
      handleCancelEdit()
      return
    }

    // Prüfe auf Duplikat
    if (tourLengths.includes(editValue.trim())) {
      toast.error('Diese Tourlänge existiert bereits')
      return
    }

    const success = await dataRepository.renameTourLength(editingLength, editValue.trim())
    if (success) {
      const settings = await dataRepository.getSettings()
      setTourLengths(settings.tourLengths)
      toast.success('Tourlänge umbenannt!')
      setEditingLength(null)
      setEditValue('')
    } else {
      toast.error('Diese Tourlänge existiert bereits')
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
    
    const dragIndexStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/html')
    const dragIndex = parseInt(dragIndexStr)
    
    if (isNaN(dragIndex) || dragIndex === dropIndex) return

    const newOrder = [...tourLengths]
    const [removed] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, removed)

    await dataRepository.updateTourLengthsOrder(newOrder)
    setTourLengths(newOrder)
    toast.success('Reihenfolge aktualisiert!')
  }

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
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-white"
          >
            <Link href="/settings">
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
        <h1>Tourlängen</h1>
        <CardDescription>Verwalte die verfügbaren Tourlängen</CardDescription>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Neue Tourlänge hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newLength}
              onChange={(e) => {
                setNewLength(e.target.value)
                setError('')
              }}
              placeholder="z.B. Mehrtagestour"
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
          <CardTitle>Tourlängen ({tourLengths.length})</CardTitle>
          <CardDescription>Ziehe die Einträge, um die Reihenfolge zu ändern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tourLengths.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Keine Tourlängen vorhanden</p>
            ) : (
              tourLengths.map((length, index) => {
                const isDragOver = dragOverIndex === index
                
                return (
                  <div key={length} className="relative">
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
                      className="flex items-center justify-between p-3 bg-muted rounded-md border border-border cursor-move hover:bg-muted transition-all group relative"
                    >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-muted-foreground group-hover:text-muted-foreground flex-shrink-0 text-sm">☰</span>
                    {editingLength === length ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveEdit()
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              handleCancelEdit()
                            }
                          }}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            draggable={false}
                            onClick={handleSaveEdit}
                            onDragStart={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0"
                            aria-label="Speichern"
                          >
                            <Check className="w-4 h-4" strokeWidth={2} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            draggable={false}
                            onClick={handleCancelEdit}
                            onDragStart={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0"
                            aria-label="Abbrechen"
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-foreground truncate text-sm flex-1 min-w-0">{length}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            draggable={false}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(length)
                            }}
                            onDragStart={(e) => e.stopPropagation()}
                            className="h-9 w-9 p-0"
                            aria-label="Bearbeiten"
                          >
                            <SquarePen className="w-4 h-4" strokeWidth={2} />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            draggable={false}
                            onClick={() => handleRemove(length)}
                            onDragStart={(e) => e.stopPropagation()}
                            className="h-9 w-9 p-0"
                            aria-label="Entfernen"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
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
