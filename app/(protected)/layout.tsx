'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MobileTabBar } from '@/components/navigation/MobileTabBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Settings } from 'lucide-react'
import { UserRole } from '@/lib/types'

// Helper function to translate user roles to German
function getRoleLabel(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    leader: 'Tourenleiter',
    member: 'Mitglied',
  }
  return roleLabels[role]
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      // Wait for Supabase to restore session from localStorage
      // onAuthStateChange with INITIAL_SESSION should fire, but we also wait a bit
      // to ensure the session is fully restored
      await new Promise(resolve => setTimeout(resolve, 200))
      
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
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }




  // Desktop Navigation Items mit 2-Ebenen-Struktur
  const desktopNavItems = useMemo(() => {
    if (!user) return []
    const items: Array<{ href?: string; label: string; children?: Array<{ href: string; label: string }> }> = [
      { href: '/dashboard', label: 'Dashboard' },
      {
        label: 'Touren',
        children: [
          { href: '/tours', label: 'Touren-Übersicht' },
          ...(user.role === 'admin' || user.role === 'leader' ? [{ href: '/tours/create', label: 'Tour erstellen' }] : []),
        ],
      },
    ]
    if (user.role === 'admin') {
      items.push({
        label: 'Einstellungen',
        children: [
          { href: '/settings', label: 'Allgemein' },
          { href: '/users', label: 'Benutzerverwaltung' },
          { href: '/invitations', label: 'Einladungen' },
        ],
      })
    }
    // Hilfe als letzter Navigationspunkt
    items.push({ href: '/help', label: 'Hilfe' })
    return items
  }, [user])

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
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 flex-shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold gradient-text tracking-tight">ASC</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {desktopNavItems.map((item) => {
                  const itemKey = item.href || item.label
                  const hasChildren = item.children && item.children.length > 0
                  const isParentActive = hasChildren && item.children?.some(
                    c => pathname === c.href || 
                    (c.href === '/tours' && pathname?.startsWith('/tours/')) || 
                    (c.href === '/users' && pathname?.startsWith('/users/')) || 
                    (c.href === '/invitations' && pathname?.startsWith('/invitations/'))
                  )

                  if (hasChildren) {
                    return (
                      <DropdownMenu key={itemKey}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                              isParentActive
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {item.label}
                            <ChevronDown className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {item.children?.map((child) => {
                            const isActive = pathname === child.href || 
                              (child.href === '/tours' && pathname?.startsWith('/tours/')) || 
                              (child.href === '/users' && pathname?.startsWith('/users/')) || 
                              (child.href === '/invitations' && pathname?.startsWith('/invitations/'))
                            return (
                              <DropdownMenuItem key={child.href} asChild>
                                <Link
                                  href={child.href}
                                  className={`w-full ${
                                    isActive
                                      ? 'bg-primary-50 text-primary-600'
                                      : ''
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }

                  // Normales Link-Item ohne Untermenü
                  if (!item.href) return null
                  
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={itemKey}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Settings Icon für Mobile (nur Admin) */}
              {user.role === 'admin' && (
                <Link
                  href="/settings"
                  className={`sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target ${
                    pathname === '/settings' || pathname?.startsWith('/settings/')
                      ? 'bg-primary-50'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  aria-label="Einstellungen"
                >
                  <Settings 
                    className={`w-5 h-5 ${
                      pathname === '/settings' || pathname?.startsWith('/settings/')
                        ? 'text-primary-600'
                        : 'text-gray-700'
                    }`} 
                    strokeWidth={2} 
                  />
                </Link>
              )}
                <Button
                  variant="ghost"
                  asChild
                  className={`hidden sm:flex items-center gap-2 ${
                    pathname === '/profile' ? 'bg-primary-50 text-primary-600' : ''
                  }`}
                >
                  <Link href="/profile">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={user.profilePhoto || undefined}
                        alt={user.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary-100 text-primary-600 text-xs font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </Link>
                </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 sm:pb-12 w-full" style={{ paddingBottom: 'clamp(5rem, 4rem + env(safe-area-inset-bottom, 0px), 6rem)' }}>
        {children}
      </main>
      {/* Mobile Tab Bar */}
      <MobileTabBar />
    </div>
  )
}

