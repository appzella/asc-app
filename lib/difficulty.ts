import { Difficulty, TourType, TourSettings } from './types'
import { dataRepository } from './data'

export interface DifficultyOption {
  value: Difficulty
  label: string
  description?: string
}

/**
 * Gibt die passenden Schwierigkeitsoptionen basierend auf der Tourenart zurück
 * Verwendet jetzt die konfigurierbaren Einstellungen
 * 
 * @param tourType - Die Tourenart
 * @param settings - Optional: TourSettings (um async Aufrufe zu vermeiden)
 */
export function getDifficultyOptions(tourType: TourType | '', settings?: TourSettings): DifficultyOption[] {
  if (!tourType) {
    return []
  }

  // Falls Settings nicht übergeben wurden, verwende leeren Array als Fallback
  // Die Komponenten sollten die Settings bereits geladen haben
  const difficulties = settings?.difficulties[tourType] || []

  // Fallback-Beschreibungen für bekannte Schwierigkeitsgrade
  const descriptions: Record<string, string> = {
    'T1': 'Wege meist eben oder schwach geneigt',
    'T2': 'Meist steile Fußwege',
    'T3': 'Steil, stellenweise exponiert',
    'T4': 'Steil, exponiert, teilweise mit Seilen gesichert',
    'T5': 'Sehr steil, sehr exponiert, oft mit Seilen gesichert',
    'T6': 'Extrem steil, extrem exponiert, Kletterpassagen',
    'L': 'Bis 30°, keine Ausrutschgefahr',
    'WS': 'Ab 30°, kürzere Rutschwege',
    'ZS': 'Ab 35°, längere Rutschwege',
    'S': 'Ab 40°, lange Rutschwege, Lebensgefahr',
    'SS': 'Ab 45°, Rutschwege in Steilstufen abbrechend',
    'AS': 'Ab 50°, äußerst ausgesetzt',
    'EX': 'Ab 55°, extrem ausgesetzt, eventuell Abseilen nötig',
    'B1': 'Einfache Wege, geringe Steigung',
    'B2': 'Mittlere Steigung, technisch einfach',
    'B3': 'Steil, technisch anspruchsvoll',
    'B4': 'Sehr steil, sehr technisch anspruchsvoll',
    'B5': 'Extrem steil und technisch, für Experten',
  }

  return difficulties.map((diff) => ({
    value: diff as Difficulty,
    label: diff,
    description: descriptions[diff],
  }))
}

/**
 * Formatiert die Schwierigkeit für die Anzeige
 */
export function formatDifficulty(difficulty: Difficulty, tourType?: TourType): string {
  const options = tourType ? getDifficultyOptions(tourType) : []
  const option = options.find((opt) => opt.value === difficulty)
  return option ? option.label : difficulty
}

