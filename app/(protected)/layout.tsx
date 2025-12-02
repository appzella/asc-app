'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const currentUser = await authService.getCurrentUserAsync()

      if (!isMounted) return

      setUser(currentUser)
      setIsLoading(false)

      if (!currentUser) {
        router.push('/login')
        return
      }
    }

    initializeAuth()

    const unsubscribe = authService.subscribe((updatedUser) => {
      if (!isMounted) return

      setUser(updatedUser)
      // Don't set isLoading to false here if we're still initializing
      // The initial load will handle that

      if (!updatedUser && !isLoading) {
        router.push('/login')
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [router, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Lädt...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AdminPanelLayout>
      {children}
    </AdminPanelLayout>
  )
}
