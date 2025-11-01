'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ImageCropper } from '@/components/ui/ImageCropper'
import Image from 'next/image'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    mobile: '',
    street: '',
    zip: '',
    city: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        mobile: currentUser.mobile || '',
        street: currentUser.street || '',
        zip: currentUser.zip || '',
        city: currentUser.city || '',
      })
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
      if (updatedUser) {
        setFormData({
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          mobile: updatedUser.mobile || '',
          street: updatedUser.street || '',
          zip: updatedUser.zip || '',
          city: updatedUser.city || '',
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Die Datei ist zu groß. Bitte wählen Sie eine Datei unter 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie ein Bild aus.')
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
      setError('Fehler beim Lesen der Datei')
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!user) return

    setShowCropper(false)
    setImageToCrop(null)
    setIsLoading(true)
    setError('')

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
          setSuccess('Profilfoto erfolgreich aktualisiert!')
          setTimeout(() => setSuccess(''), 3000)
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
            setSuccess('Profilfoto erfolgreich aktualisiert!')
            setTimeout(() => setSuccess(''), 3000)
          }
        }
        reader.onerror = () => {
          setError('Fehler beim Lesen der Datei')
        }
        reader.readAsDataURL(croppedFile)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Fehler beim Hochladen des Profilfotos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImageToCrop(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = await dataRepository.updateUser(user.id, {
        name: formData.name,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        street: formData.street || undefined,
        zip: formData.zip || undefined,
        city: formData.city || undefined,
      })

      if (updatedUser) {
        setUser(updatedUser)
        setSuccess('Profil erfolgreich aktualisiert!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren des Profils')
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
        setSuccess('Profilfoto entfernt!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Fehler beim Entfernen des Profilfotos')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Die neuen Passwörter stimmen nicht überein')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Das neue Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setIsLoading(true)

    try {
      // Verify current password by trying to login
      const testLogin = await authService.login(user!.email, passwordData.currentPassword)
      if (!testLogin) {
        setPasswordError('Das aktuelle Passwort ist falsch')
        setIsLoading(false)
        return
      }

      // Change password
      const success = await authService.changePassword(passwordData.newPassword)

      if (success) {
        setPasswordSuccess('Passwort erfolgreich geändert!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setShowPasswordChange(false)
        setTimeout(() => setPasswordSuccess(''), 3000)
      } else {
        setPasswordError('Fehler beim Ändern des Passworts')
      }
    } catch (err) {
      console.error('Password change error:', err)
      setPasswordError('Ein Fehler ist aufgetreten')
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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
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
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil</h1>
            <p className="text-base text-gray-600">Verwalten Sie Ihre persönlichen Informationen</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Abmelden
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profilfoto */}
        <Card>
          <CardHeader>
            <CardTitle>Profilfoto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              {user.profilePhoto ? (
                <Image
                  src={user.profilePhoto}
                  alt={user.name}
                  width={128}
                  height={128}
                  unoptimized
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-gray-300 mb-4"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-gray-300 mb-4">
                  <span className="text-2xl md:text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {user.profilePhoto ? 'Ändern' : 'Hochladen'}
                </Button>
                {user.profilePhoto && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Entfernen
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Max. 5MB, JPG, PNG oder GIF
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Persönliche Informationen */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ihr Name"
                  />

                  <Input
                    label="E-Mail"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Telefon (Festnetz)"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+41 XX XXX XX XX"
                  />

                  <Input
                    label="Mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+41 XX XXX XX XX"
                  />
                </div>

                <div className="space-y-4 pt-2 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Adresse</h3>
                  <Input
                    label="Strasse"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Musterstrasse 123"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="PLZ"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="9000"
                    />

                    <Input
                      label="Ort"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="St. Gallen"
                    />
                  </div>
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

                <div className="pt-2">
                  <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
                    {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Passwort ändern */}
          <Card>
            <CardHeader>
              <CardTitle>Passwort ändern</CardTitle>
            </CardHeader>
            <CardContent>
              {!showPasswordChange ? (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordChange(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Passwort ändern
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Input
                    label="Aktuelles Passwort"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                    placeholder="Ihr aktuelles Passwort"
                  />
                  <Input
                    label="Neues Passwort"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    placeholder="Mindestens 6 Zeichen"
                    minLength={6}
                  />
                  <Input
                    label="Neues Passwort bestätigen"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    placeholder="Passwort wiederholen"
                    minLength={6}
                  />

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                        setPasswordError('')
                        setPasswordSuccess('')
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}

