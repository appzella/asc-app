import { User, Tour, Invitation, TourSettings } from '../types'

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
  getPublishedTours(): Promise<Tour[]>
  getDraftTours(): Promise<Tour[]>
  createTour(tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status' | 'waitlist'>): Promise<Tour>
  updateTour(id: string, updates: Partial<Tour>): Promise<Tour | null>
  publishTour(id: string): Promise<Tour | null>
  unpublishTour(id: string): Promise<Tour | null>
  cancelTour(id: string): Promise<Tour | null>
  registerForTour(tourId: string, userId: string): Promise<boolean>
  unregisterFromTour(tourId: string, userId: string): Promise<boolean>
  addParticipantManually(tourId: string, userId: string): Promise<boolean> // Manuelles Hinzufügen durch Leader/Admin
  deleteTour(id: string): Promise<boolean>

  // Waitlist Management
  addToWaitlist(tourId: string, userId: string): Promise<boolean>
  removeFromWaitlist(tourId: string, userId: string): Promise<boolean>
  getWaitlistByTourId(tourId: string): Promise<User[]>
  promoteFromWaitlist(tourId: string, userId: string): Promise<boolean> // Manuelles Hinzufügen durch Leader/Admin

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
  renameTourType(oldName: string, newName: string): Promise<boolean>
  updateTourTypeIcon(tourType: string, iconName: string): Promise<boolean>
  addTourLength(length: string): Promise<boolean>
  removeTourLength(length: string): Promise<boolean>
  renameTourLength(oldName: string, newName: string): Promise<boolean>
  updateTourTypesOrder(orderedTypes: string[]): Promise<void>
  updateTourLengthsOrder(orderedLengths: string[]): Promise<void>
  addDifficulty(tourType: string, difficulty: string): Promise<boolean>
  removeDifficulty(tourType: string, difficulty: string): Promise<boolean>
  renameDifficulty(tourType: string, oldName: string, newName: string): Promise<boolean>
  updateDifficultiesOrder(tourType: string, orderedDifficulties: string[]): Promise<void>
  getDifficultiesForTourType(tourType: string): Promise<string[]>

  // File Upload
  uploadGpxFile(tourId: string, file: File): Promise<string>
  deleteGpxFile(gpxUrl: string): Promise<void>
  uploadProfilePhoto(userId: string, file: File): Promise<string>
  deleteProfilePhoto(photoUrl: string): Promise<void>
}

