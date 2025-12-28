export type UserRole = 'admin' | 'leader' | 'member'

export type TourStatus = 'draft' | 'published' | 'cancelled' | 'completed'

// Tour Type as object (from database)
export interface TourType {
  name: string
  label: string
  icon?: string
}

// Tour Length as object (from database)
export interface TourLength {
  name: string
  label: string
  description?: string
}

// SAC Schwierigkeitsskalen (for type safety)
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
  phone?: string
  mobile?: string
  street?: string
  zip?: string
  city?: string
  emergencyContact?: string
  profilePhoto?: string | null
  isActive?: boolean
  createdAt?: string
  // User settings
  theme?: 'light' | 'dark' | 'system'
  emailNotifications?: boolean
  pushNotifications?: boolean
}

export interface Tour {
  id: string
  title: string
  description?: string
  date: string // ISO date string
  time?: string
  type: string // e.g., 'ski', 'hike', 'snowshoe'
  difficulty?: string // e.g., 'L', 'WS', 'T2'
  length?: string // e.g., 'short', 'medium', 'long'
  peak?: string // Name of the peak/destination
  peakElevation?: number // Height of the peak in meters
  ascent?: number // Höhenmeter (ascent)
  descent?: number // Höhenmeter (descent)
  durationMin?: number // Minimum duration in hours (e.g., 3.5)
  durationMax?: number // Maximum duration in hours (e.g., 5.0)
  leaderId: string // User-ID des Tourenleiters
  leader?: User // Referenz zum Leader
  maxParticipants?: number
  meetingPoint?: string // Treffpunkt
  meetingPointLink?: string // Google Maps Link
  status: TourStatus
  participants: User[] // Array of User objects
  waitlist: User[] // Array of User objects on waitlist
  createdAt?: string
  updatedAt?: string
  gpxFile?: string | null // URL zur GPX-Datei in Supabase Storage
  whatsappLink?: string | null // WhatsApp-Gruppen-Link
}

export interface Invitation {
  id: string
  email: string
  token: string
  createdBy: string // Admin-ID
  createdAt: string
  used: boolean
}

export interface TourSettings {
  tourTypes: string[]
  tourLengths: string[]
  difficulties?: {
    [tourType: string]: string[]
  }
  tourTypeIcons?: { [tourType: string]: string }
}

export type NotificationType = 'NEW_TOUR' | 'PARTICIPANT_SIGNUP' | 'TOUR_UPDATE'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export interface NotificationPreferences {
  userId: string
  emailNewTour: boolean
  pushNewTour: boolean
  emailParticipantSignup: boolean
  pushParticipantSignup: boolean
  emailTourUpdate: boolean
  pushTourUpdate: boolean
  createdAt: string
  updatedAt: string
}
