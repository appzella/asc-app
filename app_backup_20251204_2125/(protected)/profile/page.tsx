'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, UserCircle, Lock, Bell } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileForm } from '@/components/profile/profile-form'
import { PasswordForm } from '@/components/profile/password-form'
import { NotificationSettings } from '@/components/profile/notification-settings'
import { ContentLayout } from '@/components/content-layout'

import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeProfile = async () => {
      const currentUser = await authService.getCurrentUserAsync()
      if (!isMounted) return
      setUser(currentUser)
      setIsLoading(false)
    }

    initializeProfile()

    const unsubscribe = authService.subscribe((updatedUser) => {
      if (!isMounted) return
      setUser(updatedUser)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ContentLayout
      title="Profil"

    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              Verwalte deine persönlichen Informationen und Einstellungen.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="profile" className="gap-2">
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Passwort</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Benachrichtigungen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Persönliche Informationen</CardTitle>
                <CardDescription>
                  Aktualisiere dein Profilbild und deine Kontaktdaten.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} setUser={setUser} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passwort ändern</CardTitle>
                <CardDescription>
                  Ändere dein Passwort, um deinen Account zu schützen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  )
}
