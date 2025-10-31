'use client'

import { useState, useEffect, useRef } from 'react'
import { authService } from '@/lib/auth'
import { dataStore } from '@/lib/data/mockData'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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

    setIsLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        const updatedUser = dataStore.updateUser(user.id, {
          profilePhoto: base64String,
        })
        if (updatedUser) {
          setUser(updatedUser)
          setSuccess('Profilfoto erfolgreich aktualisiert!')
          setTimeout(() => setSuccess(''), 3000)
        }
        setIsLoading(false)
      }
      reader.onerror = () => {
        setError('Fehler beim Lesen der Datei')
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Fehler beim Hochladen des Profilfotos')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = dataStore.updateUser(user.id, {
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

  const handleRemovePhoto = () => {
    if (!user) return

    const updatedUser = dataStore.updateUser(user.id, {
      profilePhoto: undefined,
    })

    if (updatedUser) {
      setUser(updatedUser)
      setSuccess('Profilfoto entfernt!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  if (!user) {
    return <div>Lädt...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Profil</h1>
        <p className="text-lg text-gray-600">Verwalten Sie Ihre persönlichen Informationen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profilfoto */}
        <Card>
          <CardHeader>
            <CardTitle>Profilfoto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-modern mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-gray-200 shadow-modern mb-4">
                  <span className="text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
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
                >
                  {user.profilePhoto ? 'Ändern' : 'Hochladen'}
                </Button>
                {user.profilePhoto && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Adresse</h3>
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
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

