'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Invitation } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

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
      
      // Automatically send email
      try {
        const emailResponse = await fetch('/api/invitations/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationId: invitation.id }),
        })

        if (emailResponse.ok) {
          setMessage({
            type: 'success',
            text: `Einladung erstellt und E-Mail an ${email} gesendet!`,
          })
        } else {
          // Fallback: Show link if email fails
          const registrationLink = `${window.location.origin}/register/${invitation.token}`
          const errorData = await emailResponse.json().catch(() => ({}))
          
          setMessage({
            type: 'success',
            text: `Einladung erstellt! E-Mail konnte nicht automatisch gesendet werden. Link: ${registrationLink}`,
          })
          
          console.warn('Email sending failed:', errorData)
        }
      } catch (emailError) {
        // Fallback: Show link if email request fails completely
        const registrationLink = `${window.location.origin}/register/${invitation.token}`
        
        setMessage({
          type: 'success',
          text: `Einladung erstellt! E-Mail konnte nicht gesendet werden. Link: ${registrationLink}`,
        })
        
        console.warn('Email sending error:', emailError)
      }
      
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Link 
            href="/settings" 
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Zurück zur Übersicht
          </Link>
          <Link 
            href="/settings"
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target bg-gray-50 hover:bg-gray-100"
            aria-label="Zurück zur Übersicht"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Einladungen</h1>
        <p className="text-base text-gray-600">Erstellen Sie Einladungen für neue Clubmitglieder</p>
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
                className={`px-4 py-3 rounded-md text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}
            <Button type="submit" variant="default" disabled={isLoading} size="sm">
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
            <p className="text-gray-500 text-center py-8 text-sm">Noch keine Einladungen erstellt</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const registrationLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${invitation.token}`
                return (
                  <div
                    key={invitation.id}
                    className="border border-gray-200 rounded-md p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{invitation.email}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Erstellt am {new Date(invitation.createdAt).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                      {invitation.used ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Verwendet
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          Ausstehend
                        </span>
                      )}
                    </div>
                    {!invitation.used && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                        <Input
                          value={registrationLink}
                          readOnly
                          className="flex-1 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(registrationLink)}
                          className="w-full sm:w-auto"
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

