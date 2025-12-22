'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Subscribe to auth changes
        const unsubscribe = authService.subscribe((currentUser) => {
            setUser(currentUser)
            setIsLoading(false)

            // Redirect to login if not authenticated
            if (!currentUser && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
                router.replace('/login')
            }
        })

        return () => unsubscribe()
    }, [router, pathname])

    // Show nothing while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    // If not authenticated, show nothing (redirect is happening)
    if (!user) {
        return null
    }

    return <>{children}</>
}
