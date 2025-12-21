'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Gauge, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { dataStore } from '@/lib/data/mockData'

export default function DifficultiesPage() {
    const [tourTypes, setTourTypes] = useState<string[]>([])
    const [difficulties, setDifficulties] = useState<Record<string, string[]>>({})
    const [expandedTypes, setExpandedTypes] = useState<string[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedTourType, setSelectedTourType] = useState<string>('')
    const [newDifficultyName, setNewDifficultyName] = useState('')
    const [editingDifficulty, setEditingDifficulty] = useState<{ tourType: string; name: string } | null>(null)
    const [editedName, setEditedName] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        const settings = dataStore.getSettings()
        setTourTypes(settings.tourTypes)
        setDifficulties(settings.difficulties)
        // Expand first type by default
        if (settings.tourTypes.length > 0 && expandedTypes.length === 0) {
            setExpandedTypes([settings.tourTypes[0]])
        }
    }

    const toggleExpanded = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const handleAddDifficulty = () => {
        if (!selectedTourType || !newDifficultyName.trim()) {
            toast.error('Bitte alle Felder ausfüllen')
            return
        }

        const success = dataStore.addDifficulty(selectedTourType, newDifficultyName.trim())
        if (success) {
            toast.success(`"${newDifficultyName.trim()}" wurde hinzugefügt`)
            loadData()
            setNewDifficultyName('')
            setIsAddDialogOpen(false)
        } else {
            toast.error('Dieser Schwierigkeitsgrad existiert bereits')
        }
    }

    const handleEditDifficulty = () => {
        if (!editingDifficulty || !editedName.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.renameDifficulty(
            editingDifficulty.tourType,
            editingDifficulty.name,
            editedName.trim()
        )
        if (success) {
            toast.success(`Umbenannt zu "${editedName.trim()}"`)
            loadData()
            setIsEditDialogOpen(false)
            setEditingDifficulty(null)
            setEditedName('')
        } else {
            toast.error('Dieser Name existiert bereits')
        }
    }

    const handleDeleteDifficulty = () => {
        if (!editingDifficulty) return

        const success = dataStore.removeDifficulty(
            editingDifficulty.tourType,
            editingDifficulty.name
        )
        if (success) {
            toast.success(`"${editingDifficulty.name}" wurde gelöscht`)
            loadData()
            setIsDeleteDialogOpen(false)
            setEditingDifficulty(null)
        } else {
            toast.error('Fehler beim Löschen')
        }
    }

    const openAddDialog = (tourType?: string) => {
        setSelectedTourType(tourType || tourTypes[0] || '')
        setNewDifficultyName('')
        setIsAddDialogOpen(true)
    }

    const openEditDialog = (tourType: string, difficulty: string) => {
        setEditingDifficulty({ tourType, name: difficulty })
        setEditedName(difficulty)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (tourType: string, difficulty: string) => {
        setEditingDifficulty({ tourType, name: difficulty })
        setIsDeleteDialogOpen(true)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Schwierigkeitsgrade</h1>
                <p className="text-muted-foreground">
                    Verwalte die Schwierigkeitsgrade pro Tourenart.
                </p>
            </div>

            <div className="px-4 lg:px-6 max-w-2xl">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Gauge className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Schwierigkeitsgrade</CardTitle>
                                    <CardDescription>
                                        {tourTypes.length} Tourenarten mit Schwierigkeiten
                                    </CardDescription>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => openAddDialog()}>
                                <Plus className="h-4 w-4 mr-1" />
                                Hinzufügen
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tourTypes.map((tourType) => (
                                <Collapsible
                                    key={tourType}
                                    open={expandedTypes.includes(tourType)}
                                    onOpenChange={() => toggleExpanded(tourType)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <ChevronDown
                                                    className={`h-4 w-4 text-muted-foreground transition-transform ${expandedTypes.includes(tourType) ? 'rotate-180' : ''
                                                        }`}
                                                />
                                                <span className="font-medium">{tourType}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {difficulties[tourType]?.length || 0}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openAddDialog(tourType)
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="ml-6 mt-2 space-y-1">
                                            {difficulties[tourType]?.map((difficulty) => (
                                                <div
                                                    key={difficulty}
                                                    className="flex items-center justify-between p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                                                        <span className="text-sm">{difficulty}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => openEditDialog(tourType, difficulty)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => openDeleteDialog(tourType, difficulty)}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!difficulties[tourType] || difficulties[tourType].length === 0) && (
                                                <div className="text-center py-4 text-sm text-muted-foreground">
                                                    Keine Schwierigkeitsgrade definiert
                                                </div>
                                            )}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}

                            {tourTypes.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Keine Tourenarten vorhanden. Erstelle zuerst eine Tourenart.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neuer Schwierigkeitsgrad</DialogTitle>
                        <DialogDescription>
                            Füge einen neuen Schwierigkeitsgrad hinzu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tourenart</Label>
                            <Select value={selectedTourType} onValueChange={setSelectedTourType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tourenart wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tourTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Schwierigkeitsgrad</Label>
                            <Input
                                placeholder="z.B. T3"
                                value={newDifficultyName}
                                onChange={(e) => setNewDifficultyName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDifficulty()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleAddDifficulty}>Hinzufügen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schwierigkeitsgrad bearbeiten</DialogTitle>
                        <DialogDescription>
                            Ändere den Namen des Schwierigkeitsgrades für {editingDifficulty?.tourType}.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditDifficulty()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleEditDifficulty}>Speichern</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Schwierigkeitsgrad löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du "{editingDifficulty?.name}" für {editingDifficulty?.tourType} wirklich löschen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDifficulty} className="bg-destructive text-white hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
