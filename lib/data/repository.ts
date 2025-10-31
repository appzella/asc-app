import { User, Tour, ChatMessage, Invitation, TourSettings } from '../types'

/**
 * Repository Interface
 * Definiert die Abstraktionsschicht für Datenzugriff
 * Implementierungen: MockDataStore, SupabaseDataStore
 */
export interface IDataRepository {
  // User Management
  getUsers(): Promise<User[]>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>
  updateUser(id: string, updates: Partial<User>): Promise<User | null>

  // Tours
  getTours(): Promise<Tour[]>
  getTourById(id: string): Promise<Tour | null>
  getApprovedTours(): Promise<Tour[]>
  getPendingTours(): Promise<Tour[]>
  createTour(tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status'>): Promise<Tour>
  updateTour(id: string, updates: Partial<Tour>, submitForApproval?: boolean): Promise<Tour | null>
  approveTour(id: string): Promise<Tour | null>
  rejectTour(id: string, comment?: string): Promise<Tour | null>
  registerForTour(tourId: string, userId: string): Promise<boolean>
  unregisterFromTour(tourId: string, userId: string): Promise<boolean>

  // Chat Messages
  getMessagesByTourId(tourId: string): Promise<ChatMessage[]>
  addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>

  // Invitations
  createInvitation(email: string, createdBy: string): Promise<Invitation>
  getInvitationByToken(token: string): Promise<Invitation | null>
  useInvitation(token: string, name: string, password: string): Promise<User | null>
  getInvitations(): Promise<Invitation[]>

  // Settings
  getSettings(): Promise<TourSettings>
  updateSettings(updates: Partial<TourSettings>): Promise<TourSettings>
  addTourType(type: string): Promise<boolean>
  removeTourType(type: string): Promise<boolean>
  addTourLength(length: string): Promise<boolean>
  removeTourLength(length: string): Promise<boolean>
  updateTourTypesOrder(orderedTypes: string[]): Promise<void>
  updateTourLengthsOrder(orderedLengths: string[]): Promise<void>
  addDifficulty(tourType: string, difficulty: string): Promise<boolean>
  removeDifficulty(tourType: string, difficulty: string): Promise<boolean>
  updateDifficultiesOrder(tourType: string, orderedDifficulties: string[]): Promise<void>
  getDifficultiesForTourType(tourType: string): Promise<string[]>
}

