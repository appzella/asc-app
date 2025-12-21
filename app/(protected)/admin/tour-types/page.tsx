'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Mountain } from 'lucide-react'
import { toast } from 'sonner'

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
import { Badge } from '@/components/ui/badge'
import { dataStore } from '@/lib/data/mockData'

export default function TourTypesPage() {
    const [tourTypes, setTourTypes] = useState<string[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [newTypeName, setNewTypeName] = useState('')
    const [editingType, setEditingType] = useState<string | null>(null)
    const [editedName, setEditedName] = useState('')

    useEffect(() => {
        loadTourTypes()
    }, [])

    const loadTourTypes = () => {
        const settings = dataStore.getSettings()
        setTourTypes(settings.tourTypes)
    }

    const handleAddType = () => {
        if (!newTypeName.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.addTourType(newTypeName.trim())
        if (success) {
            toast.success(`"${newTypeName.trim()}" wurde hinzugefügt`)
            loadTourTypes()
            setNewTypeName('')
            setIsAddDialogOpen(false)
        } else {
            toast.error('Dieser Tourentyp existiert bereits')
        }
    }

    const handleEditType = () => {
        if (!editingType || !editedName.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        const success = dataStore.renameTourType(editingType, editedName.trim())
        if (success) {
            toast.success(`Umbenannt zu "${editedName.trim()}"`)
            loadTourTypes()
            setIsEditDialogOpen(false)
            setEditingType(null)
            setEditedName('')
        } else {
            toast.error('Dieser Name existiert bereits')
        }
    }

    const handleDeleteType = () => {
        if (!editingType) return

        const success = dataStore.removeTourType(editingType)
        if (success) {
            toast.success(`"${editingType}" wurde gelöscht`)
            loadTourTypes()
            setIsDeleteDialogOpen(false)
            setEditingType(null)
        } else {
            toast.error('Fehler beim Löschen')
        }
    }

    const openEditDialog = (type: string) => {
        setEditingType(type)
        setEditedName(type)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (type: string) => {
        setEditingType(type)
        setIsDeleteDialogOpen(true)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Tourenarten</h1>
                <p className="text-muted-foreground">
                    Verwalte die verfügbaren Tourenarten für die App.
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
                                    <CardDescription>{tourTypes.length} Einträge</CardDescription>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Hinzufügen
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {tourTypes.map((type, index) => (
                                <div
                                    key={type}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                        <span className="font-medium">{type}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {dataStore.getDifficultiesForTourType(type).length} Schwierigkeiten
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(type)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog(type)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {tourTypes.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Keine Tourenarten vorhanden
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
                        <DialogTitle>Neue Tourenart</DialogTitle>
                        <DialogDescription>
                            Gib den Namen der neuen Tourenart ein.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="z.B. Schneeschuhtour"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleAddType}>Hinzufügen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tourenart bearbeiten</DialogTitle>
                        <DialogDescription>
                            Ändere den Namen der Tourenart.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditType()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleEditType}>Speichern</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tourenart löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du "{editingType}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                            Bestehende Touren mit dieser Tourenart werden nicht gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteType} className="bg-destructive text-white hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
