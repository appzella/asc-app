'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Invitation } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { canManageUsers } from '@/lib/roles'

export default function InvitationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadInvitations = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser && !canManageUsers(currentUser.role)) {
        router.push('/dashboard')
        return
      }

      if (currentUser) {
        const allInvitations = await dataRepository.getInvitations()
        setInvitations(allInvitations)
      }
    }

    loadInvitations()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const allInvitations = await dataRepository.getInvitations()
        setInvitations(allInvitations)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!user || !email) return

    setIsLoading(true)

    try {
      // Prüfen ob E-Mail bereits existiert
      const existingUser = await dataRepository.getUserByEmail(email)
      if (existingUser && existingUser.registered) {
        setMessage({ type: 'error', text: 'Diese E-Mail ist bereits registriert' })
        setIsLoading(false)
        return
      }

      const invitation = await dataRepository.createInvitation(email, user.id)
      
      // Generiere Registrierungslink
      const registrationLink = `${window.location.origin}/register/${invitation.token}`
      
      setMessage({
        type: 'success',
        text: `Einladung erstellt! Registrierungslink: ${registrationLink}`,
      })
      setEmail('')
      const allInvitations = await dataRepository.getInvitations()
      setInvitations(allInvitations)
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Erstellen der Einladung' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: 'Link in Zwischenablage kopiert!' })
  }

  if (!user) {
    return <div>Lädt...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Einladungen</h1>
        <p className="mt-2 text-gray-600">Erstellen Sie Einladungen für neue Clubmitglieder</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Einladung erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInvitation} className="space-y-4">
            <Input
              label="E-Mail-Adresse"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="neues.mitglied@example.com"
            />
            {message && (
              <div
                className={`px-4 py-3 rounded ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Wird erstellt...' : 'Einladung erstellen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Einladungen ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Noch keine Einladungen erstellt</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const registrationLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${invitation.token}`
                return (
                  <div
                    key={invitation.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{invitation.email}</p>
                        <p className="text-sm text-gray-500">
                          Erstellt am {new Date(invitation.createdAt).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                      {invitation.used ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verwendet
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Ausstehend
                        </span>
                      )}
                    </div>
                    {!invitation.used && (
                      <div className="flex gap-2">
                        <Input
                          value={registrationLink}
                          readOnly
                          className="flex-1 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(registrationLink)}
                        >
                          Kopieren
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

