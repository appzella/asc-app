'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { authService } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Use Supabase Auth resetPassword function
      // This will send a password reset email if the user exists
      const result = await authService.resetPassword(email)
      
      if (result) {
        // Success - email sent (or at least no error occurred)
        setSuccess(true)
      } else {
        setError('Kein Konto mit dieser E-Mail-Adresse gefunden')
      }
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">ASC Skitouren App</h1>
            <p className="text-gray-600">Passwort zurücksetzen</p>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <p className="font-semibold mb-1">E-Mail gesendet!</p>
                <p className="text-sm">
                  Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                </p>
              </div>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Zurück zur Anmeldung
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
              </p>
              <Input
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ihre.email@example.com"
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Wird gesendet...' : 'Link senden'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

