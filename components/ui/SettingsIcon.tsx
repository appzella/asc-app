import React from 'react'
import { Mountain, Calendar, Zap } from 'lucide-react'

interface SettingsIconProps {
  type: 'tour-types' | 'tour-lengths' | 'difficulties'
  className?: string
  strokeWidth?: number
}

export function SettingsIcon({ type, className = '', strokeWidth = 2 }: SettingsIconProps) {
  if (type === 'tour-types') {
    return <Mountain className={className} strokeWidth={strokeWidth} />
  }

  if (type === 'tour-lengths') {
    return <Calendar className={className} strokeWidth={strokeWidth} />
  }

  if (type === 'difficulties') {
    return <Zap className={className} strokeWidth={strokeWidth} />
  }

  return null
}

export default SettingsIcon
