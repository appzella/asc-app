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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { Trash2, ChevronLeft, SquarePen, Check, X, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { ContentLayout } from '@/components/admin-panel/content-layout'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function DifficultiesSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<{ tourTypes: string[]; tourLengths: string[]; difficulties: Record<string, string[]> }>({ tourTypes: [], tourLengths: [], difficulties: {} })
  const [selectedTourType, setSelectedTourType] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [newDifficulty, setNewDifficulty] = useState('')
  const [error, setError] = useState('')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingDifficulty, setEditingDifficulty] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      const currentUser = await authService.getCurrentUserAsync()

      if (!isMounted) return

      if (!currentUser || !canManageUsers(currentUser.role)) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      const currentSettings = await dataRepository.getSettings()
      setSettings(currentSettings)
      if (currentSettings.tourTypes.length > 0 && !selectedTourType) {
        setSelectedTourType(currentSettings.tourTypes[0])
      }
      setIsLoading(false)
    }

    loadSettings()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      if (!isMounted) return

      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
        return
      }
      setUser(updatedUser)
      const currentSettings = await dataRepository.getSettings()
      setSettings(currentSettings)
    })

    return () => {
      isMounted = false
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
      toast.error('Bitte gib einen Schwierigkeitsgrad ein')
      return
    }

    if (!selectedTourType) {
      toast.error('Bitte wähle zuerst eine Tourenart')
      return
    }

    const success = await dataRepository.addDifficulty(selectedTourType, newDifficulty.trim())
    if (success) {
      const diffs = await dataRepository.getDifficultiesForTourType(selectedTourType)
      setDifficulties(diffs)
      setNewDifficulty('')
      toast.success('Schwierigkeitsgrad hinzugefügt!')
      setError('')
    } else {
      toast.error('Dieser Schwierigkeitsgrad existiert bereits')
    }
  }

  const handleRemove = async (difficulty: string) => {
    if (!selectedTourType) return

    const success = await dataRepository.removeDifficulty(selectedTourType, difficulty)
    if (success) {
      const diffs = await dataRepository.getDifficultiesForTourType(selectedTourType)
      setDifficulties(diffs)
      toast.success('Schwierigkeitsgrad entfernt!')
    }
  }

  const handleStartEdit = (difficulty: string) => {
    setEditingDifficulty(difficulty)
    setEditValue(difficulty)
  }

  const handleCancelEdit = () => {
    setEditingDifficulty(null)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!selectedTourType || !editingDifficulty || !editValue.trim()) {
      toast.error('Bitte gib einen Namen ein')
      return
    }

    if (editValue.trim() === editingDifficulty) {
      handleCancelEdit()
      return
    }

    // Prüfe auf Duplikat
    if (difficulties.includes(editValue.trim())) {
      toast.error('Dieser Schwierigkeitsgrad existiert bereits')
      return
    }

    const success = await dataRepository.renameDifficulty(selectedTourType, editingDifficulty, editValue.trim())
    if (success) {
      const diffs = await dataRepository.getDifficultiesForTourType(selectedTourType)
      setDifficulties(diffs)
      toast.success('Schwierigkeitsgrad umbenannt!')
      setEditingDifficulty(null)
      setEditValue('')
    } else {
      toast.error('Dieser Schwierigkeitsgrad existiert bereits')
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
    toast.success('Reihenfolge aktualisiert!')
  }

  if (isLoading || !user) {
    return (
      <ContentLayout
        title="Schwierigkeitsgrade"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/settings">Einstellungen</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Schwierigkeitsgrade</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      >
        <div className="max-w-4xl mx-auto space-y-6">
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
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout
      title="Schwierigkeitsgrade"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/settings">Einstellungen</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Schwierigkeitsgrade</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <p className="text-muted-foreground">
            Verwalten Sie die Schwierigkeitsgrade für jede Tourenart.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tourenart auswählen</CardTitle>
            <CardDescription>Wählen Sie eine Tourenart, um deren Schwierigkeitsgrade zu bearbeiten.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tour-type-select">Tourenart</Label>
              <Select
                value={selectedTourType}
                onValueChange={(value) => {
                  setSelectedTourType(value)
                  setNewDifficulty('')
                  setError('')
                }}
              >
                <SelectTrigger id="tour-type-select" className="w-full">
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
          </CardContent>
        </Card>

        {selectedTourType && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Neuen Schwierigkeitsgrad hinzufügen</CardTitle>
                <CardDescription>Fügen Sie einen neuen Schwierigkeitsgrad für {selectedTourType} hinzu.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
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
                  <Button onClick={handleAdd}>Hinzufügen</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schwierigkeitsgrade ({difficulties.length})</CardTitle>
                <CardDescription>Ziehen Sie die Einträge, um die Reihenfolge zu ändern.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {difficulties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Keine Schwierigkeitsgrade vorhanden
                    </div>
                  ) : (
                    difficulties.map((difficulty, index) => {
                      const isDragOver = dragOverIndex === index

                      return (
                        <div key={difficulty} className="relative">
                          {isDragOver && (
                            <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
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
                            className="flex items-center justify-between p-3 bg-card rounded-md border hover:bg-accent/50 transition-all group relative"
                          >
                            <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />

                            <div className="flex items-center gap-3 flex-1 min-w-0 ml-2">
                              {editingDifficulty === difficulty ? (
                                <div className="flex-1 flex items-center gap-2">
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
                                    className="h-9"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-9 w-9">
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-9 w-9">
                                    <X className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="flex-1 font-medium truncate">{difficulty}</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleStartEdit(difficulty)}
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    >
                                      <SquarePen className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleRemove(difficulty)}
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
          </>
        )}
      </div>
    </ContentLayout>
  )
}
