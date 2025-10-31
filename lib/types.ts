export type UserRole = 'admin' | 'leader' | 'member'

export type TourStatus = 'pending' | 'approved' | 'rejected'

export type TourType = 'Wanderung' | 'Skitour' | 'Bike'

export type TourLength = 'Eintagestour' | 'Mehrtagestour'

// SAC Schwierigkeitsskalen
export type Difficulty = 
  // Wanderungen (T-Skala)
  | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6'
  // Skitouren (SAC-Skala)
  | 'L' | 'WS' | 'ZS' | 'S' | 'SS' | 'AS' | 'EX'
  // Bike (vereinfachte Skala)
  | 'B1' | 'B2' | 'B3' | 'B4' | 'B5'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  password?: string // Nur für Dummy-Daten, später nicht mehr vorhanden
  createdAt: Date
  invitedBy?: string // Admin-ID, der die Einladung erstellt hat
  registrationToken?: string // Token für Registrierung
  registered: boolean // Ob der User bereits registriert ist
  profilePhoto?: string // Base64 encoded image oder URL
  phone?: string // Festnetz
  mobile?: string // Mobiltelefon
  street?: string // Strasse
  zip?: string // Postleitzahl
  city?: string // Ort
}

export interface Tour {
  id: string
  title: string
  description: string
  date: Date
  difficulty: Difficulty
  tourType: TourType
  tourLength: TourLength
  elevation: number // Höhenmeter
  duration: number // Dauer in Stunden
  leaderId: string // User-ID des Tourenleiters
  leader?: User // Referenz zum Leader
  maxParticipants: number
  status: TourStatus
  participants: string[] // Array von User-IDs
  createdAt: Date
  updatedAt: Date
  createdBy: string // User-ID
  rejectionComment?: string // Kommentar bei Ablehnung vom Admin
  pendingChanges?: Partial<Tour> // Ausstehende Änderungen, die auf Freigabe warten
}

export interface ChatMessage {
  id: string
  tourId: string
  userId: string
  user?: User // Referenz zum User
  message: string
  createdAt: Date
}

export interface Invitation {
  id: string
  email: string
  token: string
  createdBy: string // Admin-ID
  createdAt: Date
  used: boolean
  usedAt?: Date
}

export interface TourSettings {
  tourTypes: string[]
  tourLengths: string[]
  difficulties: {
    [tourType: string]: string[] // z.B. { 'Wanderung': ['T1', 'T2', ...], 'Skitour': ['L', 'WS', ...] }
  }
}
