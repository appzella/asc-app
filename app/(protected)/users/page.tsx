'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, UserRole } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { ChevronLeft, Edit, Upload, Trash2, Camera, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ImageCropper } from '@/components/ui/ImageCropper'

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<User>>({})
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Profile Picture State
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadUsers = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser && !canManageUsers(currentUser.role)) {
        router.push('/dashboard')
        return
      }

      if (currentUser) {
        const allUsers = await dataRepository.getUsers()
        setUsers(allUsers)
      }
    }

    loadUsers()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const allUsers = await dataRepository.getUsers()
        setUsers(allUsers)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await dataRepository.updateUser(userId, { role: newRole })
    const allUsers = await dataRepository.getUsers()
    setUsers(allUsers)
    toast.success('Rolle wurde aktualisiert')
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!user) return

    // Prüfe ob sich der aktuelle User selbst deaktivieren will
    if (userId === user.id && !currentActive) {
      toast.error('Du kannst dich nicht selbst deaktivieren')
      return
    }

    try {
      const success = await dataRepository.updateUser(userId, { active: !currentActive })
      if (success) {
        const allUsers = await dataRepository.getUsers()
        setUsers(allUsers)
        toast.success(currentActive ? 'Benutzer wurde deaktiviert' : 'Benutzer wurde aktiviert')
      } else {
        toast.error('Fehler beim Aktualisieren des Benutzers')
      }
    } catch (error) {
      console.error('Error toggling user active status:', error)
      toast.error('Fehler beim Aktualisieren des Benutzers')
    }
  }

  const handleEditClick = (u: User) => {
    setEditingUser(u)
    setEditFormData({
      name: u.name,
      email: u.email,
      phone: u.phone,
      mobile: u.mobile,
      street: u.street,
      zip: u.zip,
      city: u.city,
    })
    setShowEditDialog(true)
  }

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß. Bitte wähle eine Datei unter 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle ein Bild aus.')
      return
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Read file as data URL to show in cropper
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageDataUrl = reader.result as string
      setImageToCrop(imageDataUrl)
      setShowCropper(true)
    }
    reader.onerror = () => {
      toast.error('Fehler beim Lesen der Datei')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!editingUser) return

    setShowCropper(false)
    setImageToCrop(null)
    setUploadLoading(true)

    try {
      // Convert blob to File
      const croppedFile = new File([croppedImageBlob], 'profile-photo.jpg', {
        type: 'image/jpeg',
      })

      // Delete old photo if exists and is not a base64 string (which shouldn't happen for stored photos)
      if (editingUser.profilePhoto && !editingUser.profilePhoto.startsWith('data:')) {
        try {
          const repo = dataRepository as any
          if (repo.deleteProfilePhoto) {
            await repo.deleteProfilePhoto(editingUser.profilePhoto)
          }
        } catch (deleteError) {
          console.warn('Could not delete old photo:', deleteError)
        }
      }

      // Upload to Supabase Storage
      const repo = dataRepository as any
      if (typeof repo.uploadProfilePhoto === 'function') {
        const photoUrl = await repo.uploadProfilePhoto(editingUser.id, croppedFile)

        // Update user with new photo URL immediately
        const updatedUser = await dataRepository.updateUser(editingUser.id, {
          profilePhoto: photoUrl,
        })

        if (updatedUser) {
          // Update local state
          setEditingUser(updatedUser)
          setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))

          // If editing self, update current user
          if (user && user.id === updatedUser.id) {
            setUser(updatedUser)
            await authService.refreshCurrentUser()
          }

          toast.success('Profilfoto erfolgreich aktualisiert!')
        }
      } else {
        toast.error('Profilfoto-Upload wird nicht unterstützt')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Fehler beim Hochladen des Profilfotos')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImageToCrop(null)
  }

  const handleRemovePhoto = async () => {
    if (!editingUser || !editingUser.profilePhoto) return

    setUploadLoading(true)
    try {
      // Delete from storage if it's a URL
      if (!editingUser.profilePhoto.startsWith('data:')) {
        try {
          const repo = dataRepository as any
          if (typeof repo.deleteProfilePhoto === 'function') {
            await repo.deleteProfilePhoto(editingUser.profilePhoto)
          }
        } catch (deleteError) {
          console.warn('Could not delete photo from storage:', deleteError)
        }
      }

      // Remove from database
      const updatedUser = await dataRepository.updateUser(editingUser.id, {
        profilePhoto: null,
      })

      if (updatedUser) {
        setEditingUser(updatedUser)
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))

        // If editing self, update current user
        if (user && user.id === updatedUser.id) {
          setUser(updatedUser)
          await authService.refreshCurrentUser()
        }

        toast.success('Profilfoto entfernt!')
      }
    } catch (err) {
      toast.error('Fehler beim Entfernen des Profilfotos')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      const updated = await dataRepository.updateUser(editingUser.id, editFormData)
      if (updated) {
        const allUsers = await dataRepository.getUsers()
        setUsers(allUsers)
        setShowEditDialog(false)
        setEditingUser(null)
        toast.success('Benutzer wurde aktualisiert')
      } else {
        toast.error('Fehler beim Aktualisieren des Benutzers')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Fehler beim Aktualisieren des Benutzers')
    }
  }


  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
        <h1>Benutzerverwaltung</h1>
        <CardDescription>Verwalte Benutzer und deren Rollen</CardDescription>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">Keine Benutzer vorhanden</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktiv</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.profilePhoto || undefined} alt={u.name || 'Unbekannt'} className="object-cover" />
                            <AvatarFallback>
                              {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name || 'Unbekannt'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-40 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Mitglied</SelectItem>
                            <SelectItem value="leader">Tourenleiter</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.registered ? (
                          <Badge variant="outline-success">
                            Registriert
                          </Badge>
                        ) : (
                          <Badge variant="outline-warning">
                            Ausstehend
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.active}
                            onCheckedChange={() => handleToggleActive(u.id, u.active)}
                            disabled={u.id === user?.id && !u.active}
                          />
                          <span className="text-xs text-muted-foreground">
                            {u.active ? 'Aktiv' : 'Deaktiviert'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(u)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite die Benutzerinformationen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 overflow-y-auto flex-1 px-1">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-muted">
                  <AvatarImage
                    src={editingUser?.profilePhoto || undefined}
                    alt={editingUser?.name || 'User'}
                    className="object-cover"
                    key={editingUser?.profilePhoto || editingUser?.id} // Force re-render on change
                  />
                  <AvatarFallback className="text-2xl">
                    {editingUser?.name ? editingUser.name.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Bild ändern
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadLoading}
                />
                {editingUser?.profilePhoto && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleRemovePhoto}
                    disabled={uploadLoading}
                    className="h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-Mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon (Festnetz)</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobiltelefon</Label>
                <Input
                  id="edit-mobile"
                  value={editFormData.mobile || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-street">Strasse</Label>
                <Input
                  id="edit-street"
                  value={editFormData.street || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-zip">PLZ</Label>
                  <Input
                    id="edit-zip"
                    value={editFormData.zip || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, zip: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Ort</Label>
                  <Input
                    id="edit-city"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
        />
      )}

    </div>
  )
}

