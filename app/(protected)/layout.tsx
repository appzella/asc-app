'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MobileTabBar } from '@/components/navigation/MobileTabBar'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
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


  // Alle Hooks müssen VOR frühen Returns aufgerufen werden!
  const [desktopExpandedItems, setDesktopExpandedItems] = useState<Set<string>>(new Set())
  
  const toggleDesktopExpanded = useCallback((key: string) => {
    setDesktopExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        // Schließe andere Dropdowns
        next.clear()
        next.add(key)
      }
      return next
    })
  }, [])

  // Schließe Dropdowns beim Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.desktop-nav-dropdown')) {
        setDesktopExpandedItems(new Set())
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50 backdrop-blur-xl flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold gradient-text tracking-tight">ASC</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1 relative">
                {desktopNavItems.map((item) => {
                  const itemKey = item.href || item.label
                  const hasChildren = item.children && item.children.length > 0
                  const isExpanded = desktopExpandedItems.has(itemKey)

                  if (hasChildren) {
                    return (
                      <div key={itemKey} className="relative desktop-nav-dropdown">
                        <button
                          onClick={() => toggleDesktopExpanded(itemKey)}
                          className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            item.children?.some(c => pathname === c.href || (c.href === '/tours' && pathname?.startsWith('/tours/')) || (c.href === '/users' && pathname?.startsWith('/users/')) || (c.href === '/invitations' && pathname?.startsWith('/invitations/')))
                              ? 'bg-primary-50 text-primary-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            strokeWidth={1.8}
                          />
                        </button>
                        {isExpanded && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            {item.children?.map((child) => {
                              const isActive = pathname === child.href || (child.href === '/tours' && pathname?.startsWith('/tours/')) || (child.href === '/users' && pathname?.startsWith('/users/')) || (child.href === '/invitations' && pathname?.startsWith('/invitations/'))
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setDesktopExpandedItems(new Set())}
                                  className={`block px-4 py-2 text-sm transition-colors ${
                                    isActive
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Normales Link-Item ohne Untermenü
                  if (!item.href) return null
                  
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={itemKey}
                      href={item.href}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-sm'
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
              <Link href="/profile" className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                {user.profilePhoto ? (
                  <Image 
                    src={user.profilePhoto} 
                    alt={user.name}
                    width={32}
                    height={32}
                    unoptimized
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-xs font-semibold text-primary-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2.5 py-1 rounded-lg">
                  {getRoleLabel(user.role)}
                </span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="shadow-sm hidden sm:flex">
                Abmelden
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

