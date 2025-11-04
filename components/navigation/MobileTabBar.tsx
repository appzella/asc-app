'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      className="fixed bottom-0 left-0 right-0 z-50 block sm:hidden"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        position: 'fixed',
        transform: 'translateZ(0)', // Hardware acceleration für iOS
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform'
      }}
      aria-label="Mobile Tab Bar"
    >
      <div className="w-full">
        <div className="bg-white rounded-t-lg border-t border-gray-200 shadow-lg">
          <ul className="grid grid-cols-3">
            {tabs.map((tab) => {
              const active = isActive(tab.href)
              const IconComponent = tab.icon
              return (
                <li key={tab.href}>
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-3 gap-1 rounded-none w-full touch-manipulation min-h-[60px]",
                      active && "bg-primary-50 text-primary-600"
                    )}
                  >
                  <Link
                    href={tab.href}
                      className="flex flex-col items-center justify-center gap-1 w-full"
                    aria-current={active ? 'page' : undefined}
                  >
                    <IconComponent
                        className={cn(
                          "w-5 h-5",
                          active ? "text-primary-600" : "text-gray-500"
                        )}
                      strokeWidth={2}
                    />
                      <span className={cn(
                        "text-xs font-medium",
                        active ? "text-primary-600" : "text-gray-600"
                      )}>
                      {tab.label}
                    </span>
                  </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default MobileTabBar
