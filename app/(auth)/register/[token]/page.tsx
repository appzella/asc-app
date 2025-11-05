'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { dataRepository } from '@/lib/data'
import { authService } from '@/lib/auth'

const registerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
  confirmPassword: z.string().min(6, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  })

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

  const onSubmit = async (values: RegisterFormValues) => {
    setError('')
    setIsSuccess(false)
    setIsLoading(true)

    try {
      const user = await authService.register(invitation.email, values.password, values.name, token)
      if (user) {
        // User is logged in (email confirmation disabled)
        router.push('/dashboard')
        router.refresh()
      } else {
        // Registration succeeded but email confirmation is required
        setIsSuccess(true)
        setError('')
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', err)
      }
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!invitation && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registrierung</CardTitle>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            Erstelle dein Konto für {invitation?.email}
          </p>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-2">Registrierung erfolgreich!</div>
                <div className="text-sm">
                  Wir haben eine Bestätigungs-E-Mail an <strong>{invitation?.email}</strong> gesendet.
                  Bitte öffne dein Postfach und klicke auf den Bestätigungslink, um dein Konto zu aktivieren.
                  Danach kannst du dich mit deinen Zugangsdaten anmelden.
                </div>
              </AlertDescription>
            </Alert>
          ) : error && !invitation ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
              <Input
                type="text"
                placeholder="Dein Name"
                          {...field}
              />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort bestätigen</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? 'Wird registriert...' : 'Registrieren'}
              </Button>
            </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

