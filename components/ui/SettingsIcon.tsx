import React from 'react'
import { Mountain, Calendar, Zap } from 'lucide-react'

interface SettingsIconProps {
  type: 'tour-types' | 'tour-lengths' | 'difficulties'
  className?: string
}

export function SettingsIcon({ type, className = '' }: SettingsIconProps) {
  const baseClasses = `stroke-gray-600 ${className}`

  if (type === 'tour-types') {
    return <Mountain className={baseClasses} strokeWidth={1.8} />
  }

  if (type === 'tour-lengths') {
    return <Calendar className={baseClasses} strokeWidth={1.8} />
  }

  if (type === 'difficulties') {
    return <Zap className={baseClasses} strokeWidth={1.8} />
  }

  return null
}

export default SettingsIcon
