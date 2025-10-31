'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MobileTabBar } from '@/components/navigation/MobileTabBar'
import { Drawer } from '@/components/navigation/Drawer'
import { MenuButton } from '@/components/navigation/MenuButton'
import { ChevronRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      const currentUser = await authService.getCurrentUserAsync()
      setUser(currentUser)
      setIsLoading(false)

      if (!currentUser) {
        router.push('/login')
        return
      }
    }

    initializeAuth()

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser) {
        router.push('/login')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

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

  const drawerItems = useMemo(() => {
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
      { href: '/help', label: 'Hilfe' },
    ]
    if (user.role === 'admin') {
      items.push({
        label: 'Benutzer',
        children: [
          { href: '/users', label: 'Benutzerverwaltung' },
          { href: '/invitations', label: 'Einladungen' },
        ],
      })
      items.push({ href: '/settings', label: 'Einstellungen' })
    }
    items.push({ href: '/profile', label: 'Profil' })
    return items
  }, [user])

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
      { href: '/help', label: 'Hilfe' },
    ]
    if (user.role === 'admin') {
      items.push({
        label: 'Benutzer',
        children: [
          { href: '/users', label: 'Benutzerverwaltung' },
          { href: '/invitations', label: 'Einladungen' },
        ],
      })
      items.push({ href: '/settings', label: 'Einstellungen' })
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-2">
              <MenuButton open={isDrawerOpen} onToggle={() => setIsDrawerOpen((v) => !v)} />
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
                  {user.role}
                </span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="shadow-sm">
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 sm:pb-12" style={{ paddingBottom: 'clamp(5rem, 4rem + env(safe-area-inset-bottom, 0px), 6rem)' }}>
        {children}
      </main>
      {/* Mobile Drawer */}
      <Drawer open={isDrawerOpen} onClose={closeDrawer} title="Navigation">
        <ul className="space-y-1" id="mobile-drawer">
          {drawerItems.map((item) => {
            const itemKey = item.href || item.label
            const isExpanded = expandedItems.has(itemKey)
            const hasChildren = item.children && item.children.length > 0
            
            if (hasChildren) {
              return (
                <li key={itemKey}>
                  <button
                    onClick={() => toggleExpanded(itemKey)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium touch-manipulation text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight
                      className={`w-5 h-5 stroke-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      strokeWidth={1.8}
                    />
                  </button>
                  {isExpanded && item.children && (
                    <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href || (child.href === '/tours' && pathname?.startsWith('/tours/'))
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={closeDrawer}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium touch-manipulation ${
                                isActive
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                              }`}
                            >
                              <span>{child.label}</span>
                              {isActive ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                              ) : null}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            }
            
            // Normales Link-Item ohne Untermenü
            if (!item.href) return null
            
            const isActive = pathname === item.href || (item.href === '/tours' && pathname?.startsWith('/tours/'))
            return (
              <li key={itemKey}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium touch-manipulation ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="pt-3 mt-3 border-t border-gray-100">
          <Button variant="outline" className="w-full touch-manipulation" onClick={() => { closeDrawer(); handleLogout() }}>
            Abmelden
          </Button>
        </div>
      </Drawer>
      {/* Mobile Tab Bar */}
      <MobileTabBar />
    </div>
  )
}

