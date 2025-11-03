'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dataRepository } from '@/lib/data'
import { authService } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        const inv = await dataRepository.getInvitationByToken(token)
        if (!inv) {
          setError('Ungültiger oder bereits verwendeter Einladungslink')
        } else {
          setInvitation(inv)
        }
      } catch (err) {
        setError('Fehler beim Laden der Einladung')
      }
    }
    loadInvitation()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setIsLoading(true)

    try {
      const user = await authService.register(invitation.email, password, name, token)
      if (user) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Registrierung fehlgeschlagen')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  if (!invitation && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registrierung</CardTitle>
          <p className="text-center text-gray-600 mt-2 text-sm">
            Erstellen Sie Ihr Konto für {invitation?.email}
          </p>
        </CardHeader>
        <CardContent>
          {error && !invitation ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ihr Name"
              />
              <Input
                label="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Passwort bestätigen"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? 'Wird registriert...' : 'Registrieren'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

