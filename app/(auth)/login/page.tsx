'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import Snowfall from 'react-snowfall'

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
      const user = await authService.login(values.email, values.password)

      if (user) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Ungültige E-Mail oder Passwort')
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err)
      }
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Image
        src="/login-background.jpg"
        alt="Login Background"
        fill
        className="object-cover"
        priority
      />
      <div className="w-full absolute inset-0 h-full z-0">
        <Snowfall
          color="white"
          snowflakeCount={1500}
          radius={[0.2, 1.0]}
          speed={[1.0, 5.0]}
          wind={[0.5, 4.0]}
        />
      </div>
      <Card className="w-full max-w-md animate-scale-in relative z-10">
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
                        tabIndex={-1}
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

