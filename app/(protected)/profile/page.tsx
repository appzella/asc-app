'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { UserCircle, Lock, LogOut, Upload, X, Camera, ImageIcon, Trash2 } from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { toast } from 'sonner'

const profileSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
  confirmPassword: z.string().min(6, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      mobile: '',
      street: '',
      zip: '',
      city: '',
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let isMounted = true

    const initializeProfile = async () => {
      // Use async method to get the most recent user data
      const currentUser = await authService.getCurrentUserAsync()

      if (!isMounted) return

      setUser(currentUser)

      if (currentUser) {
        profileForm.reset({
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          mobile: currentUser.mobile || '',
          street: currentUser.street || '',
          zip: currentUser.zip || '',
          city: currentUser.city || '',
        })
      }
    }

    initializeProfile()

    const unsubscribe = authService.subscribe((updatedUser) => {
      if (!isMounted) return

      setUser(updatedUser)
      if (updatedUser) {
        // Nur resetten wenn sich die Werte wirklich geändert haben und Form nicht gerade bearbeitet wird
        const isDirty = profileForm.formState.isDirty
        if (!isDirty) {
          profileForm.reset({
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone || '',
            mobile: updatedUser.mobile || '',
            street: updatedUser.street || '',
            zip: updatedUser.zip || '',
            city: updatedUser.city || '',
          })
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
    // eslint-disable-next-line react-hook-form/exhaustive-deps
  }, [])

  const processFile = (file: File) => {
    if (!user) return

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!user) return

    setShowCropper(false)
    setImageToCrop(null)
    setIsLoading(true)

    try {
      // Convert blob to File
      const croppedFile = new File([croppedImageBlob], 'profile-photo.jpg', {
        type: 'image/jpeg',
      })

      // Delete old photo if exists
      if (user.profilePhoto && !user.profilePhoto.startsWith('data:')) {
        // Only delete if it's a URL (from storage), not base64
        try {
          const repo = dataRepository as any
          if (repo.deleteProfilePhoto) {
            await repo.deleteProfilePhoto(user.profilePhoto)
          }
        } catch (deleteError) {
          // Ignore delete errors
          console.warn('Could not delete old photo:', deleteError)
        }
      }

      // Upload to Supabase Storage
      // Check if we have uploadProfilePhoto method (Supabase repository)
      const repo = dataRepository as any
      if (typeof repo.uploadProfilePhoto === 'function') {
        const photoUrl = await repo.uploadProfilePhoto(user.id, croppedFile)

        // Update user with new photo URL
        const updatedUser = await dataRepository.updateUser(user.id, {
          profilePhoto: photoUrl,
        })

        if (updatedUser) {
          setUser(updatedUser)
          // Refresh authService to update navbar and other components
          await authService.refreshCurrentUser()
          toast.success('Profilfoto erfolgreich aktualisiert!')
        }
      } else {
        // Fallback: Base64 if storage not available
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64String = reader.result as string
          const updatedUser = await dataRepository.updateUser(user.id, {
            profilePhoto: base64String,
          })
          if (updatedUser) {
            setUser(updatedUser)
            // Refresh authService to update navbar and other components
            await authService.refreshCurrentUser()
            toast.success('Profilfoto erfolgreich aktualisiert!')
          }
        }
        reader.onerror = () => {
          toast.error('Fehler beim Lesen der Datei')
        }
        reader.readAsDataURL(croppedFile)
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Fehler beim Hochladen des Profilfotos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImageToCrop(null)
  }

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return

    setIsLoading(true)

    try {
      const updatedUser = await dataRepository.updateUser(user.id, {
        name: values.name,
        phone: values.phone?.trim() || '',
        mobile: values.mobile?.trim() || '',
        street: values.street?.trim() || '',
        zip: values.zip?.trim() || '',
        city: values.city?.trim() || '',
      })

      if (updatedUser) {
        setUser(updatedUser)
        // Refresh authService to update navbar and other components
        await authService.refreshCurrentUser()
        toast.success('Profil erfolgreich aktualisiert!')
      }
    } catch (err) {
      toast.error('Fehler beim Aktualisieren des Profils')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!user || !user.profilePhoto) return

    setIsLoading(true)
    try {
      // Delete from storage if it's a URL
      if (!user.profilePhoto.startsWith('data:')) {
        try {
          const repo = dataRepository as any
          if (typeof repo.deleteProfilePhoto === 'function') {
            await repo.deleteProfilePhoto(user.profilePhoto)
          }
        } catch (deleteError) {
          // Ignore delete errors
          console.warn('Could not delete photo from storage:', deleteError)
        }
      }

      // Remove from database (use null to explicitly remove the photo)
      const updatedUser = await dataRepository.updateUser(user.id, {
        profilePhoto: null,
      })

      if (updatedUser) {
        setUser(updatedUser)
        // Refresh authService to update navbar and other components
        await authService.refreshCurrentUser()
        toast.success('Profilfoto entfernt!')
      }
    } catch (err) {
      toast.error('Fehler beim Entfernen des Profilfotos')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!user) return

    setIsLoading(true)

    try {
      // Verify current password by trying to login
      const testLogin = await authService.login(user.email, values.currentPassword)
      if (!testLogin) {
        passwordForm.setError('currentPassword', { message: 'Das aktuelle Passwort ist falsch' })
        setIsLoading(false)
        return
      }

      // Change password
      const success = await authService.changePassword(values.newPassword)

      if (success) {
        toast.success('Passwort erfolgreich geändert!')
        passwordForm.reset()
      } else {
        toast.error('Fehler beim Ändern des Passworts')
      }
    } catch (err) {
      console.error('Password change error:', err)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="h-fit">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <Skeleton className="w-32 h-32 rounded-full mb-4" />
                <Skeleton className="h-9 w-full mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
        />
      )}
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Profil</h1>
            <p className="text-muted-foreground">Verwalte deine persönlichen Informationen und E-Mail-Einstellungen</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <Card className="p-2">
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'profile'
                        ? "bg-primary-50 text-primary-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <UserCircle className="w-4 h-4" />
                    Profil
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'password'
                        ? "bg-primary-50 text-primary-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Lock className="w-4 h-4" />
                    Passwort
                  </button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === 'profile'
                    ? "bg-background text-primary-600 shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <UserCircle className="w-4 h-4" />
                Profil
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === 'password'
                    ? "bg-background text-primary-600 shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <Lock className="w-4 h-4" />
                Passwort
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Persönliche Informationen</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      {/* Profilfoto Section - Horizontal Layout */}
                      <div className="flex items-center gap-4">
                        <div
                          className="relative group flex-shrink-0"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Avatar className="w-20 h-20">
                            <AvatarImage
                              src={user.profilePhoto || undefined}
                              alt={user.name}
                              className="object-cover"
                              key={user.profilePhoto || user.id}
                            />
                            <AvatarFallback>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {user.profilePhoto ? 'Bild ändern' : 'Bild hochladen'}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                          {user.profilePhoto && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={handleRemovePhoto}
                              disabled={isLoading}
                              className="h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Drag & Drop Overlay */}
                      {isDragging && (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className="fixed inset-0 z-50 bg-primary-50/95 backdrop-blur-sm flex items-center justify-center"
                        >
                          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border-2 border-dashed border-primary-500 bg-background shadow-xl">
                            <Upload className="w-12 h-12 text-primary-600 animate-bounce" />
                            <p className="text-lg font-medium text-primary-600">Loslassen zum Hochladen</p>
                          </div>
                        </div>
                      )}

                      {/* Upload Progress */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            {uploadProgress}% hochgeladen
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Ihr Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail</FormLabel>
                              <FormControl>
                                <Input type="email" disabled className="bg-muted" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon (Festnetz)</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  defaultCountry="CH"
                                  countries={['CH', 'DE', 'AT', 'FR', 'IT', 'LI']}
                                  value={field.value || undefined}
                                  onChange={(value) => {
                                    // Wenn der Wert nur aus dem Ländercode besteht (z.B. "+670" oder "+41"), setze undefined
                                    // Ländercodes sind normalerweise 1-3 Ziffern nach dem "+"
                                    if (value && /^\+[0-9]{1,3}$/.test(value)) {
                                      field.onChange(undefined)
                                    } else {
                                      field.onChange(value || undefined)
                                    }
                                  }}
                                  placeholder="Telefonnummer eingeben"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  defaultCountry="CH"
                                  countries={['CH', 'DE', 'AT', 'FR', 'IT', 'LI']}
                                  value={field.value || undefined}
                                  onChange={(value) => {
                                    // Wenn der Wert nur aus dem Ländercode besteht (z.B. "+670" oder "+41"), setze undefined
                                    // Ländercodes sind normalerweise 1-3 Ziffern nach dem "+"
                                    if (value && /^\+[0-9]{1,3}$/.test(value)) {
                                      field.onChange(undefined)
                                    } else {
                                      field.onChange(value || undefined)
                                    }
                                  }}
                                  placeholder="Handynummer eingeben"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-1">Adresse</h4>
                          <p className="text-xs text-muted-foreground">Deine Kontaktadresse</p>
                        </div>
                        <FormField
                          control={profileForm.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <AddressAutocomplete
                                  value={profileForm.watch('street') || ''}
                                  onChange={(value) => {
                                    field.onChange(value)
                                  }}
                                  onAddressSelect={(address) => {
                                    profileForm.setValue('street', address.street)
                                    profileForm.setValue('zip', address.zip)
                                    profileForm.setValue('city', address.city)
                                  }}
                                  placeholder="Adresse eingeben (z.B. Musterstrasse 123, 9000 St. Gallen)"
                                  useGooglePlaces={!!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-1/4">
                            <FormField
                              control={profileForm.control}
                              name="zip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PLZ</FormLabel>
                                  <FormControl>
                                    <Input placeholder="9000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="w-full md:flex-1">
                            <FormField
                              control={profileForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ort</FormLabel>
                                  <FormControl>
                                    <Input placeholder="St. Gallen" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button type="submit" variant="default" disabled={isLoading} className="w-full sm:w-auto">
                          {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'password' && (
              <Card>
                <CardHeader>
                  <CardTitle>Passwort ändern</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aktuelles Passwort</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Ihr aktuelles Passwort"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Neues Passwort</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Mindestens 6 Zeichen"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Neues Passwort bestätigen</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Passwort wiederholen"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button type="submit" variant="default" disabled={isLoading} className="w-full sm:w-auto">
                          {isLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

