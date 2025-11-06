import { IDataRepository } from './repository'
import { User, Tour, ChatMessage, Invitation, TourSettings } from '../types'
import { dataStore } from './mockData'

/**
 * Mock Data Repository Implementation
 * Wrapper um den bestehenden mockData DataStore
 * Konvertiert sync zu async für Konsistenz mit Supabase
 */
export class MockDataRepository implements IDataRepository {
  // User Management
  async getUsers(): Promise<User[]> {
    return dataStore.getUsers()
  }

  async getUserById(id: string): Promise<User | null> {
    return dataStore.getUserById(id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return dataStore.getUserByEmail(email) || null
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return dataStore.createUser(user)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return dataStore.updateUser(id, updates)
  }

  // Tours
  async getTours(): Promise<Tour[]> {
    return dataStore.getTours()
  }

  async getTourById(id: string): Promise<Tour | null> {
    return dataStore.getTourById(id) || null
  }

  async getPublishedTours(): Promise<Tour[]> {
    return dataStore.getTours().filter(t => t.status === 'published')
  }

  async getDraftTours(): Promise<Tour[]> {
    return dataStore.getTours().filter(t => t.status === 'draft')
  }

  async getToursSubmittedForPublishing(): Promise<Tour[]> {
    return dataStore.getTours().filter(t => t.status === 'draft' && t.submittedForPublishing === true)
  }

  async createTour(tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status' | 'waitlist'>): Promise<Tour> {
    return dataStore.createTour(tour)
  }

  async updateTour(id: string, updates: Partial<Tour>, submitForApproval = false): Promise<Tour | null> {
    return dataStore.updateTour(id, updates, submitForApproval)
  }

  async publishTour(id: string): Promise<Tour | null> {
    const tour = dataStore.getTourById(id)
    if (!tour) return null
    tour.status = 'published'
    tour.submittedForPublishing = false
    return tour
  }

  async unpublishTour(id: string): Promise<Tour | null> {
    const tour = dataStore.getTourById(id)
    if (!tour) return null
    tour.status = 'draft'
    tour.submittedForPublishing = false
    return tour
  }

  async cancelTour(id: string): Promise<Tour | null> {
    const tour = dataStore.getTourById(id)
    if (!tour) return null
    tour.status = 'cancelled'
    tour.submittedForPublishing = false
    return tour
  }

  async submitTourForPublishing(id: string): Promise<Tour | null> {
    const tour = dataStore.getTourById(id)
    if (!tour) return null
    tour.submittedForPublishing = true
    return tour
  }

  async deleteTour(id: string): Promise<boolean> {
    const index = dataStore['tours'].findIndex(t => t.id === id)
    if (index === -1) return false
    dataStore['tours'].splice(index, 1)
    return true
  }

  async registerForTour(tourId: string, userId: string): Promise<boolean> {
    // Check if tour is published (not draft, cancelled, etc.)
    const tour = await this.getTourById(tourId)
    if (!tour || tour.status !== 'published') {
      return false
    }
    
    // Prüfe ob Tour archiviert ist (Datum in der Vergangenheit)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tourDate = new Date(tour.date)
    tourDate.setHours(0, 0, 0, 0)
    if (tourDate < today) {
      return false
    }
    
    return dataStore.registerForTour(tourId, userId)
  }

  async unregisterFromTour(tourId: string, userId: string): Promise<boolean> {
    return dataStore.unregisterFromTour(tourId, userId)
  }

  // Chat Messages
  async getMessagesByTourId(tourId: string): Promise<ChatMessage[]> {
    return dataStore.getMessagesByTourId(tourId)
  }

  async addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    return dataStore.addMessage(message)
  }

  // Chat Read Status (Mock - uses localStorage as fallback)
  async markTourAsRead(tourId: string, userId: string, timestamp: Date | string): Promise<boolean> {
    if (typeof window === 'undefined') return false
    const timestampStr = timestamp instanceof Date ? timestamp.toISOString() : timestamp
    localStorage.setItem(`chat_last_read_${tourId}_${userId}`, timestampStr)
    return true
  }

  async getLastReadTimestamp(tourId: string, userId: string): Promise<Date | null> {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(`chat_last_read_${tourId}_${userId}`)
    if (!stored) return null
    try {
      return new Date(stored)
    } catch {
      return null
    }
  }

  async getUnreadCount(tourId: string, userId: string): Promise<number> {
    const lastRead = await this.getLastReadTimestamp(tourId, userId)
    const messages = await this.getMessagesByTourId(tourId)
    if (messages.length === 0) return 0
    if (!lastRead) return messages.length
    return messages.filter(msg => new Date(msg.createdAt) > lastRead).length
  }

  // Invitations
  async createInvitation(email: string, createdBy: string): Promise<Invitation> {
    return dataStore.createInvitation(email, createdBy)
  }

  async getInvitationByToken(token: string): Promise<Invitation | null> {
    return dataStore.getInvitationByToken(token) || null
  }

  async useInvitation(token: string, name: string, password: string): Promise<User | null> {
    return dataStore.useInvitation(token, name, password)
  }

  async getInvitations(): Promise<Invitation[]> {
    return dataStore.getInvitations()
  }

  // Settings
  async getSettings(): Promise<TourSettings> {
    return dataStore.getSettings()
  }

  async updateSettings(updates: Partial<TourSettings>): Promise<TourSettings> {
    return dataStore.updateSettings(updates)
  }

  async addTourType(type: string): Promise<boolean> {
    return dataStore.addTourType(type)
  }

  async removeTourType(type: string): Promise<boolean> {
    return dataStore.removeTourType(type)
  }

  async updateTourTypeIcon(tourType: string, iconName: string): Promise<boolean> {
    // Mock implementation - always returns true
    // In real implementation, this would update mockData
    return true
  }

  async addTourLength(length: string): Promise<boolean> {
    return dataStore.addTourLength(length)
  }

  async removeTourLength(length: string): Promise<boolean> {
    return dataStore.removeTourLength(length)
  }

  async updateTourTypesOrder(orderedTypes: string[]): Promise<void> {
    return dataStore.updateTourTypesOrder(orderedTypes)
  }

  async updateTourLengthsOrder(orderedLengths: string[]): Promise<void> {
    return dataStore.updateTourLengthsOrder(orderedLengths)
  }

  async addDifficulty(tourType: string, difficulty: string): Promise<boolean> {
    return dataStore.addDifficulty(tourType, difficulty)
  }

  async removeDifficulty(tourType: string, difficulty: string): Promise<boolean> {
    return dataStore.removeDifficulty(tourType, difficulty)
  }

  async updateDifficultiesOrder(tourType: string, orderedDifficulties: string[]): Promise<void> {
    return dataStore.updateDifficultiesOrder(tourType, orderedDifficulties)
  }

  async getDifficultiesForTourType(tourType: string): Promise<string[]> {
    return dataStore.getDifficultiesForTourType(tourType)
  }

  // Waitlist Management
  async addToWaitlist(tourId: string, userId: string): Promise<boolean> {
    return dataStore.addToWaitlist(tourId, userId)
  }

  async removeFromWaitlist(tourId: string, userId: string): Promise<boolean> {
    return dataStore.removeFromWaitlist(tourId, userId)
  }

  async getWaitlistByTourId(tourId: string): Promise<User[]> {
    return dataStore.getWaitlistByTourId(tourId)
  }

  async promoteFromWaitlist(tourId: string, userId: string): Promise<boolean> {
    return dataStore.promoteFromWaitlist(tourId, userId)
  }

  async addParticipantManually(tourId: string, userId: string): Promise<boolean> {
    return dataStore.addParticipantManually(tourId, userId)
  }

  // File Upload
  async uploadGpxFile(tourId: string, file: File): Promise<string> {
    // Mock implementation - returns a mock URL
    return `https://example.com/gpx/${tourId}/${file.name}`
  }

  async deleteGpxFile(gpxUrl: string): Promise<void> {
    // Mock implementation - no-op
    return
  }
}

