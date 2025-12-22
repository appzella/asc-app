'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Clock } from 'lucide-react'
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
import { dataStore } from '@/lib/data/mockData'

// Sortable item component
function SortableItem({
    id,
    onEdit,
    onDelete
}: {
    id: string
    onEdit: (id: string) => void
    onDelete: (id: string) => void
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
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                <button
                    className="cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="font-medium">{id}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(id)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(id)}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    )
}

export default function TourLengthsPage() {
    const [tourLengths, setTourLengths] = useState<string[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [newLengthName, setNewLengthName] = useState('')
    const [editingLength, setEditingLength] = useState<string | null>(null)
    const [editedName, setEditedName] = useState('')

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        loadTourLengths()
    }, [])

    const loadTourLengths = () => {
        const settings = dataStore.getSettings()
        setTourLengths(settings.tourLengths)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setTourLengths((items) => {
                const oldIndex = items.indexOf(active.id as string)
                const newIndex = items.indexOf(over.id as string)
                const newOrder = arrayMove(items, oldIndex, newIndex)

                // Persist the new order
                dataStore.updateTourLengthsOrder(newOrder)
                toast.success('Reihenfolge aktualisiert')

                return newOrder
            })
        }
    }

    const handleAddLength = () => {
        if (!newLengthName.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.addTourLength(newLengthName.trim())
        if (success) {
            toast.success(`"${newLengthName.trim()}" wurde hinzugefügt`)
            loadTourLengths()
            setNewLengthName('')
            setIsAddDialogOpen(false)
        } else {
            toast.error('Diese Tourenlänge existiert bereits')
        }
    }

    const handleEditLength = () => {
        if (!editingLength || !editedName.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.renameTourLength(editingLength, editedName.trim())
        if (success) {
            toast.success(`Umbenannt zu "${editedName.trim()}"`)
            loadTourLengths()
            setIsEditDialogOpen(false)
            setEditingLength(null)
            setEditedName('')
        } else {
            toast.error('Dieser Name existiert bereits')
        }
    }

    const handleDeleteLength = () => {
        if (!editingLength) return

        const success = dataStore.removeTourLength(editingLength)
        if (success) {
            toast.success(`"${editingLength}" wurde gelöscht`)
            loadTourLengths()
            setIsDeleteDialogOpen(false)
            setEditingLength(null)
        } else {
            toast.error('Fehler beim Löschen')
        }
    }

    const openEditDialog = (length: string) => {
        setEditingLength(length)
        setEditedName(length)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (length: string) => {
        setEditingLength(length)
        setIsDeleteDialogOpen(true)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Tourenlängen</h1>
                <p className="text-muted-foreground">
                    Verwalte die verfügbaren Tourenlängen (z.B. Eintagestour, Mehrtagestour).
                </p>
            </div>

            <div className="px-4 lg:px-6 max-w-2xl">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Tourenlängen</CardTitle>
                                    <CardDescription>{tourLengths.length} Einträge</CardDescription>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Hinzufügen
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
                                items={tourLengths}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {tourLengths.map((length) => (
                                        <SortableItem
                                            key={length}
                                            id={length}
                                            onEdit={openEditDialog}
                                            onDelete={openDeleteDialog}
                                        />
                                    ))}

                                    {tourLengths.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Keine Tourenlängen vorhanden
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                </Card>
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neue Tourenlänge</DialogTitle>
                        <DialogDescription>
                            Gib den Namen der neuen Tourenlänge ein.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="z.B. Wochenendtour"
                        value={newLengthName}
                        onChange={(e) => setNewLengthName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLength()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleAddLength}>Hinzufügen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tourenlänge bearbeiten</DialogTitle>
                        <DialogDescription>
                            Ändere den Namen der Tourenlänge.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditLength()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleEditLength}>Speichern</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tourenlänge löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du "{editingLength}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLength} className="bg-destructive text-white hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
