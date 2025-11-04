'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Navigation'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-background shadow-lg border-r border-border transform transition-transform duration-200 ease-out"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text tracking-tight">ASC</span>
            {title && <span className="text-sm text-muted-foreground">{title}</span>}
          </div>
          <button
            className="p-2 rounded-md hover:bg-accent active:bg-accent/80 touch-target transition-colors"
            onClick={onClose}
            aria-label="Menü schließen"
          >
            <X className="w-5 h-5 stroke-foreground" strokeWidth={2} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px - env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Drawer
