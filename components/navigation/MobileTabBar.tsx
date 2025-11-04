'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
}

export function MobileTabBar() {
  const pathname = usePathname()

  const tabs: TabItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/tours', label: 'Touren', icon: List },
    { href: '/profile', label: 'Profil', icon: User },
  ]

  const isActive = (href: string) => {
    if (href === '/tours') {
      return pathname === '/tours' || pathname?.startsWith('/tours/')
    }
    return pathname === href
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 block sm:hidden bg-background rounded-t-lg border-t border-border shadow-lg"
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        isolation: 'isolate',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform'
      }}
      aria-label="Mobile Tab Bar"
    >
      <ul className="grid grid-cols-3 m-0 p-0">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const IconComponent = tab.icon
          return (
            <li key={tab.href} className="flex m-0 p-0">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-none w-full touch-manipulation flex-1 transition-colors hover:bg-accent",
                  active && "bg-primary-50 text-primary-600"
                )}
                style={{
                  minHeight: 'calc(60px + max(env(safe-area-inset-bottom, 8px), 8px))',
                  paddingTop: '12px',
                  paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)',
                  justifyContent: 'flex-start'
                }}
                aria-current={active ? 'page' : undefined}
              >
                <IconComponent
                  className={cn(
                    "w-5 h-5",
                    active ? "text-primary-600" : "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />
                <span className={cn(
                  "text-xs font-medium",
                  active ? "text-primary-600" : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default MobileTabBar
