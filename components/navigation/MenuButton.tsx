'use client'

import React from 'react'
import { Menu, X } from 'lucide-react'

interface MenuButtonProps {
  open: boolean
  onToggle: () => void
}

export function MenuButton({ open, onToggle }: MenuButtonProps) {
  return (
    <button
      className="p-2 rounded-lg hover:bg-accent active:bg-accent/80 sm:hidden touch-manipulation"
      onClick={onToggle}
      aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
      aria-expanded={open}
      aria-controls="mobile-drawer"
    >
      {open ? (
        <X className="w-6 h-6 stroke-foreground" strokeWidth={1.8} />
      ) : (
        <Menu className="w-6 h-6 stroke-foreground" strokeWidth={1.8} />
      )}
    </button>
  )
}

export default MenuButton
