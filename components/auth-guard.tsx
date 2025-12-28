'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        // Check online/offline status
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)

        // Set initial offline state
        setIsOffline(!navigator.onLine)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Check initial session
        const checkSession = async () => {
            try {
                const currentUser = await authService.getCurrentUserAsync()
                setUser(currentUser)
                setIsLoading(false)

                // Redirect to login if not authenticated (only when online)
                if (!currentUser && navigator.onLine && !pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/forgot-password')) {
                    router.replace('/login')
                }
            } catch (error) {
                // Auth check failed - might be offline
                setIsLoading(false)
                if (!navigator.onLine) {
                    setIsOffline(true)
                }
            }
        }

        checkSession()

        // Subscribe to auth changes
        const unsubscribe = authService.subscribe((currentUser) => {
            setUser(currentUser)

            // Redirect to login if not authenticated (only when online)
            if (!currentUser && navigator.onLine && !pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/forgot-password')) {
                router.replace('/login')
            }
        })

        return () => {
            unsubscribe()
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [router, pathname])

    // Show nothing while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    // Show offline message if offline and not authenticated
    if (isOffline && !user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="text-center max-w-md px-6">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-muted p-4">
                            <WifiOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Du bist offline</h1>
                    <p className="text-muted-foreground mb-6">
                        Um dich anzumelden, benötigst du eine Internetverbindung.
                        Bitte verbinde dich mit dem Internet und versuche es erneut.
                    </p>
                    <Button onClick={() => window.location.reload()} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Erneut versuchen
                    </Button>
                </div>
            </div>
        )
    }

    // If not authenticated, show nothing (redirect is happening)
    if (!user) {
        return null
    }

    return <>{children}</>
}
