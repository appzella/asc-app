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
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)

    if (!currentUser) {
      router.push('/login')
      return
    }

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

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  const drawerItems = useMemo(() => {
    if (!user) return []
    const items = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/tours', label: 'Touren' },
      { href: '/help', label: 'Hilfe' },
    ]
    if (user.role === 'admin' || user.role === 'leader') {
      items.push({ href: '/tours/create', label: 'Tour erstellen' })
    }
    if (user.role === 'admin') {
      items.push(
        { href: '/users', label: 'Benutzer' },
        { href: '/invitations', label: 'Einladungen' },
        { href: '/settings', label: 'Einstellungen' }
      )
    }
    items.push({ href: '/profile', label: 'Profil' })
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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tours', label: 'Touren' },
    { href: '/help', label: 'Hilfe' },
  ]

  if (user.role === 'admin' || user.role === 'leader') {
    navItems.push({ href: '/tours/create', label: 'Tour erstellen' })
  }

  if (user.role === 'admin') {
    navItems.push(
      { href: '/users', label: 'Benutzer' },
      { href: '/invitations', label: 'Einladungen' },
      { href: '/settings', label: 'Einstellungen' }
    )
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
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname === item.href
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/profile" className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                {user.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt={user.name}
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
          {drawerItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={closeDrawer}
                className={`flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium touch-manipulation ${
                  pathname === item.href || (item.href === '/tours' && pathname?.startsWith('/tours/'))
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <span>{item.label}</span>
                {pathname === item.href || (item.href === '/tours' && pathname?.startsWith('/tours/')) ? (
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                ) : null}
              </Link>
            </li>
          ))}
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

