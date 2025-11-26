'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Invitation } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Copy } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

const invitationSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').min(1, 'E-Mail ist erforderlich'),
})

type InvitationFormValues = z.infer<typeof invitationSchema>

export default function InvitationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
    },
  })

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

  const onSubmit = async (values: InvitationFormValues) => {
    if (!user) return

    setIsLoading(true)

    try {
      // Prüfen ob E-Mail bereits existiert
      const existingUser = await dataRepository.getUserByEmail(values.email)
      if (existingUser && existingUser.registered) {
        toast.error('Diese E-Mail ist bereits registriert')
        setIsLoading(false)
        return
      }

      const invitation = await dataRepository.createInvitation(values.email, user.id)

      // Automatically send email
      try {
        const emailResponse = await fetch('/api/invitations/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationId: invitation.id }),
        })

        if (emailResponse.ok) {
          toast.success(`Einladung erstellt und E-Mail an ${values.email} gesendet!`)
        } else {
          // Fallback: Show link if email fails
          const registrationLink = `${window.location.origin}/register/${invitation.token}`
          const errorData = await emailResponse.json().catch(() => ({}))

          toast.success(`Einladung erstellt! E-Mail konnte nicht automatisch gesendet werden. Link: ${registrationLink}`)

          console.warn('Email sending failed:', errorData)
        }
      } catch (emailError) {
        // Fallback: Show link if email request fails completely
        const registrationLink = `${window.location.origin}/register/${invitation.token}`

        toast.success(`Einladung erstellt! E-Mail konnte nicht gesendet werden. Link: ${registrationLink}`)

        console.warn('Email sending error:', emailError)
      }

      form.reset()
      const allInvitations = await dataRepository.getInvitations()
      setInvitations(allInvitations)
    } catch (err) {
      toast.error('Fehler beim Erstellen der Einladung')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link in Zwischenablage kopiert!')
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
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
            className="hidden sm:inline-flex items-center gap-1 text-primary-600"
          >
            <Link href="/settings">
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
        <h1>Einladungen</h1>
        <CardDescription>Erstelle Einladungen für neue Clubmitglieder</CardDescription>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Einladung erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="neues.mitglied@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default" disabled={isLoading} size="sm">
                {isLoading ? 'Wird erstellt...' : 'Einladung erstellen'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Einladungen ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">Noch keine Einladungen erstellt</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead>Registrierungslink</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => {
                    const registrationLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register/${invitation.token}`
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                          {invitation.used ? (
                            <Badge variant="outline-success">Verwendet</Badge>
                          ) : (
                            <Badge variant="outline-warning">Ausstehend</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invitation.createdAt).toLocaleDateString('de-CH')}
                        </TableCell>
                        <TableCell>
                          {!invitation.used ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={registrationLink}
                                readOnly
                                className="flex-1 text-xs h-8"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(registrationLink)}
                                className="h-8 w-8"
                                aria-label="Link kopieren"
                              >
                                <Copy className="w-4 h-4" strokeWidth={2} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

