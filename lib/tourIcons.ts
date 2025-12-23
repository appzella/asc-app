import React from 'react'
import * as LucideIcons from 'lucide-react'
import { TourType } from './types'

/**
 * Dynamisches Laden von lucide-react Icons
 */
export function getIconByName(iconName: string): React.ComponentType<any> {
  const IconComponent = (LucideIcons as any)[iconName]
  if (!IconComponent) {
    // Keine Warnung mehr - einfach Fallback verwenden
    return LucideIcons.Mountain
  }
  return IconComponent
}

/**
 * Default Icons für Tourentypen (Fallback falls kein Icon in DB)
 */
function getDefaultIcon(tourType: string | TourType): string {
  const typeName = typeof tourType === 'string' ? tourType : tourType.name
  switch (typeName) {
    case 'Wanderung':
      return 'Mountain'
    case 'Skitour':
      return 'Ski'
    case 'Bike':
      return 'Bike'
    default:
      return 'Mountain'
  }
}

/**
 * Gibt das Icon für einen Tourentyp zurück
 * @param tourType Der Tourentyp
 * @param tourTypeIcons Optional: Icon-Mapping aus Settings
 * @returns React Component für das Icon
 */
export function getTourIcon(
  tourType: string | TourType,
  tourTypeIcons?: { [key: string]: string }
): React.ComponentType<any> {
  const typeName = typeof tourType === 'string' ? tourType : tourType.name
  const iconName = tourTypeIcons?.[typeName] || getDefaultIcon(typeName)
  return getIconByName(iconName)
}

/**
 * Gibt die Icon-Farbe für einen Tourentyp zurück
 */
export function getTourIconColor(tourType: string | TourType): string {
  const typeName = typeof tourType === 'string' ? tourType : tourType.name
  switch (typeName) {
    case 'Wanderung':
      return 'text-blue-600'
    case 'Skitour':
      return 'text-purple-600'
    case 'Bike':
      return 'text-orange-600'
    default:
      return 'text-muted-foreground'
  }
}
