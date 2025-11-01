'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, User } from 'lucide-react'

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
        <div className="glass rounded-t-lg border-t border-gray-200 shadow-sm">
          <ul className="grid grid-cols-3">
            {tabs.map((tab) => {
              const active = isActive(tab.href)
              const IconComponent = tab.icon
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`flex flex-col items-center justify-center py-3 gap-1 outline-none transition-colors touch-manipulation min-h-[60px] ${
                      active ? 'text-primary-600' : 'text-gray-600 active:text-gray-900'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${active ? 'stroke-primary-600' : 'stroke-gray-500'}`}
                      strokeWidth={2}
                    />
                    <span className={`text-xs font-medium ${active ? 'text-primary-600' : 'text-gray-600'}`}>
                      {tab.label}
                    </span>
                  </Link>
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
