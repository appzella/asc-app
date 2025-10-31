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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-out"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text tracking-tight">ASC</span>
            {title && <span className="text-sm text-gray-500">{title}</span>}
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            onClick={onClose}
            aria-label="Menü schließen"
          >
            <X className="w-6 h-6 stroke-gray-700" strokeWidth={1.8} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px - env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Drawer
