'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Mountain, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

// dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

type DialogType = 'addType' | 'editType' | 'deleteType' | 'addDifficulty' | 'editDifficulty' | 'deleteDifficulty' | null

// Sortable tour type component
function SortableTourType({
    type,
    difficulties,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onAddDifficulty,
    onEditDifficulty,
    onDeleteDifficulty,
    onReorderDifficulties,
}: {
    type: string
    difficulties: string[]
    isExpanded: boolean
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
    onAddDifficulty: () => void
    onEditDifficulty: (difficulty: string) => void
    onDeleteDifficulty: (difficulty: string) => void
    onReorderDifficulties: (newOrder: string[]) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: type })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDifficultyDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = difficulties.indexOf(active.id as string)
            const newIndex = difficulties.indexOf(over.id as string)
            const newOrder = arrayMove(difficulties, oldIndex, newIndex)
            onReorderDifficulties(newOrder)
        }
    }

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <div ref={setNodeRef} style={style} className="rounded-lg border bg-card">
                <CollapsibleTrigger asChild>
                    <div className="flex flex-wrap items-center gap-2 p-3 hover:bg-accent/50 transition-colors cursor-pointer rounded-t-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                                className="cursor-grab active:cursor-grabbing touch-none"
                                {...attributes}
                                {...listeners}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            <span className="font-medium truncate">{type}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                                {difficulties.length}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit()
                                }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete()
                                }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-t p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                                Schwierigkeitsgrade
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={onAddDifficulty}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Hinzufügen
                            </Button>
                        </div>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDifficultyDragEnd}
                        >
                            <SortableContext
                                items={difficulties}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-1">
                                    {difficulties.map((difficulty) => (
                                        <SortableDifficulty
                                            key={difficulty}
                                            id={difficulty}
                                            onEdit={() => onEditDifficulty(difficulty)}
                                            onDelete={() => onDeleteDifficulty(difficulty)}
                                        />
                                    ))}
                                    {difficulties.length === 0 && (
                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                            Keine Schwierigkeitsgrade definiert
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}

// Sortable difficulty component
function SortableDifficulty({
    id,
    onEdit,
    onDelete,
}: {
    id: string
    onEdit: () => void
    onDelete: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-2 rounded-md bg-background border hover:bg-accent/30 transition-colors"
        >
            <div className="flex items-center gap-3">
                <button
                    className="cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </button>
                <span className="text-sm">{id}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onEdit}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
            </div>
        </div>
    )
}

export default function TourTypesPage() {
    const [tourTypes, setTourTypes] = useState<string[]>([])
    const [difficulties, setDifficulties] = useState<Record<string, string[]>>({})
    const [expandedTypes, setExpandedTypes] = useState<string[]>([])

    // Dialog states
    const [activeDialog, setActiveDialog] = useState<DialogType>(null)
    const [inputValue, setInputValue] = useState('')
    const [selectedTourType, setSelectedTourType] = useState<string | null>(null)
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        const settings = dataStore.getSettings()
        setTourTypes(settings.tourTypes)
        setDifficulties(settings.difficulties ?? {})
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setTourTypes((items) => {
                const oldIndex = items.indexOf(active.id as string)
                const newIndex = items.indexOf(over.id as string)
                const newOrder = arrayMove(items, oldIndex, newIndex)

                // Persist the new order
                dataStore.updateTourTypesOrder(newOrder)
                toast.success('Reihenfolge aktualisiert')

                return newOrder
            })
        }
    }

    const handleReorderDifficulties = (tourType: string, newOrder: string[]) => {
        setDifficulties(prev => ({
            ...prev,
            [tourType]: newOrder
        }))
        dataStore.updateDifficultiesOrder(tourType, newOrder)
        toast.success('Reihenfolge aktualisiert')
    }

    const toggleExpanded = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const closeDialog = () => {
        setActiveDialog(null)
        setInputValue('')
        setSelectedTourType(null)
        setSelectedDifficulty(null)
    }

    // Tour Type Handlers
    const handleAddType = () => {
        if (!inputValue.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.addTourType(inputValue.trim())
        if (success) {
            toast.success(`"${inputValue.trim()}" wurde hinzugefügt`)
            loadData()
            // Auto-expand the new type
            setExpandedTypes(prev => [...prev, inputValue.trim()])
            closeDialog()
        } else {
            toast.error('Dieser Tourentyp existiert bereits')
        }
    }

    const handleEditType = () => {
        if (!selectedTourType || !inputValue.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.renameTourType(selectedTourType, inputValue.trim())
        if (success) {
            toast.success(`Umbenannt zu "${inputValue.trim()}"`)
            // Update expanded state
            setExpandedTypes(prev =>
                prev.map(t => t === selectedTourType ? inputValue.trim() : t)
            )
            loadData()
            closeDialog()
        } else {
            toast.error('Dieser Name existiert bereits')
        }
    }

    const handleDeleteType = () => {
        if (!selectedTourType) return

        const success = dataStore.removeTourType(selectedTourType)
        if (success) {
            toast.success(`"${selectedTourType}" wurde gelöscht`)
            setExpandedTypes(prev => prev.filter(t => t !== selectedTourType))
            loadData()
            closeDialog()
        } else {
            toast.error('Fehler beim Löschen')
        }
    }

    // Difficulty Handlers
    const handleAddDifficulty = () => {
        if (!selectedTourType || !inputValue.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.addDifficulty(selectedTourType, inputValue.trim())
        if (success) {
            toast.success(`"${inputValue.trim()}" wurde hinzugefügt`)
            loadData()
            closeDialog()
        } else {
            toast.error('Dieser Schwierigkeitsgrad existiert bereits')
        }
    }

    const handleEditDifficulty = () => {
        if (!selectedTourType || !selectedDifficulty || !inputValue.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.renameDifficulty(selectedTourType, selectedDifficulty, inputValue.trim())
        if (success) {
            toast.success(`Umbenannt zu "${inputValue.trim()}"`)
            loadData()
            closeDialog()
        } else {
            toast.error('Dieser Name existiert bereits')
        }
    }

    const handleDeleteDifficulty = () => {
        if (!selectedTourType || !selectedDifficulty) return

        const success = dataStore.removeDifficulty(selectedTourType, selectedDifficulty)
        if (success) {
            toast.success(`"${selectedDifficulty}" wurde gelöscht`)
            loadData()
            closeDialog()
        } else {
            toast.error('Fehler beim Löschen')
        }
    }

    // Dialog openers
    const openAddTypeDialog = () => {
        setInputValue('')
        setActiveDialog('addType')
    }

    const openEditTypeDialog = (type: string) => {
        setSelectedTourType(type)
        setInputValue(type)
        setActiveDialog('editType')
    }

    const openDeleteTypeDialog = (type: string) => {
        setSelectedTourType(type)
        setActiveDialog('deleteType')
    }

    const openAddDifficultyDialog = (tourType: string) => {
        setSelectedTourType(tourType)
        setInputValue('')
        setActiveDialog('addDifficulty')
    }

    const openEditDifficultyDialog = (tourType: string, difficulty: string) => {
        setSelectedTourType(tourType)
        setSelectedDifficulty(difficulty)
        setInputValue(difficulty)
        setActiveDialog('editDifficulty')
    }

    const openDeleteDifficultyDialog = (tourType: string, difficulty: string) => {
        setSelectedTourType(tourType)
        setSelectedDifficulty(difficulty)
        setActiveDialog('deleteDifficulty')
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Tourenarten & Schwierigkeiten</h1>
                <p className="text-muted-foreground">
                    Verwalte Tourenarten und deren Schwierigkeitsgrade.
                </p>
            </div>

            <div className="px-4 lg:px-6 max-w-2xl">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Mountain className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Tourenarten</CardTitle>
                                    <CardDescription>{tourTypes.length} Tourenarten</CardDescription>
                                </div>
                            </div>
                            <Button size="sm" onClick={openAddTypeDialog}>
                                <Plus className="h-4 w-4 mr-1" />
                                Tourenart
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={tourTypes}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {tourTypes.map((type) => (
                                        <SortableTourType
                                            key={type}
                                            type={type}
                                            difficulties={difficulties[type] || []}
                                            isExpanded={expandedTypes.includes(type)}
                                            onToggle={() => toggleExpanded(type)}
                                            onEdit={() => openEditTypeDialog(type)}
                                            onDelete={() => openDeleteTypeDialog(type)}
                                            onAddDifficulty={() => openAddDifficultyDialog(type)}
                                            onEditDifficulty={(difficulty) => openEditDifficultyDialog(type, difficulty)}
                                            onDeleteDifficulty={(difficulty) => openDeleteDifficultyDialog(type, difficulty)}
                                            onReorderDifficulties={(newOrder) => handleReorderDifficulties(type, newOrder)}
                                        />
                                    ))}

                                    {tourTypes.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Keine Tourenarten vorhanden
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                </Card>
            </div>

            {/* Add Tour Type Dialog */}
            <Dialog open={activeDialog === 'addType'} onOpenChange={() => closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neue Tourenart</DialogTitle>
                        <DialogDescription>
                            Gib den Namen der neuen Tourenart ein.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="z.B. Schneeschuhtour"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleAddType}>Hinzufügen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Tour Type Dialog */}
            <Dialog open={activeDialog === 'editType'} onOpenChange={() => closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tourenart bearbeiten</DialogTitle>
                        <DialogDescription>
                            Ändere den Namen der Tourenart.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditType()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleEditType}>Speichern</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Tour Type Dialog */}
            <AlertDialog open={activeDialog === 'deleteType'} onOpenChange={() => closeDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tourenart löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du "{selectedTourType}" wirklich löschen? Alle zugehörigen Schwierigkeitsgrade werden ebenfalls gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeDialog}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteType} className="bg-destructive text-white hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Difficulty Dialog */}
            <Dialog open={activeDialog === 'addDifficulty'} onOpenChange={() => closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neuer Schwierigkeitsgrad</DialogTitle>
                        <DialogDescription>
                            Füge einen neuen Schwierigkeitsgrad für "{selectedTourType}" hinzu.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="z.B. T3"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDifficulty()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleAddDifficulty}>Hinzufügen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Difficulty Dialog */}
            <Dialog open={activeDialog === 'editDifficulty'} onOpenChange={() => closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schwierigkeitsgrad bearbeiten</DialogTitle>
                        <DialogDescription>
                            Ändere den Namen des Schwierigkeitsgrades.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditDifficulty()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleEditDifficulty}>Speichern</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Difficulty Dialog */}
            <AlertDialog open={activeDialog === 'deleteDifficulty'} onOpenChange={() => closeDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Schwierigkeitsgrad löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du "{selectedDifficulty}" wirklich löschen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeDialog}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDifficulty} className="bg-destructive text-white hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
