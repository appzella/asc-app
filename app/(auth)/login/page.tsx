'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { authService } from '@/lib/auth'
import { LoginTimeoutError } from '@/lib/auth/supabaseAuth'
import { ASCLogo } from '@/components/ui/ASCLogo'

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').min(1, 'E-Mail ist erforderlich'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setError('')
    setIsLoading(true)

    try {
      // Add client-side timeout as additional safety net
      const loginPromise = authService.login(values.email, values.password)
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 35000) // 35 seconds (slightly longer than server timeout)
      })

      const user = await Promise.race([loginPromise, timeoutPromise])
      
      if (user) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Ungültige E-Mail oder Passwort')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err instanceof LoginTimeoutError || err?.message?.includes('timeout')) {
        setError('Die Anmeldung dauerte zu lange. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.')
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ASCLogo size={64} />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-2">ASC Skitouren App</h1>
            <p className="text-muted-foreground text-sm">Anmelden</p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
              <Input
                type="email"
                placeholder="deine.email@example.com"
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Passwort</FormLabel>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  Passwort vergessen?
                </a>
              </div>
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
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

