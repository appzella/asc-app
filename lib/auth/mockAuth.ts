import { User } from '../types'
import { dataStore } from '../data/mockData'

const STORAGE_KEY = 'asc_mock_auth_user_id'

/**
 * Mock Auth Service
 * Für Entwicklung ohne Supabase oder Fallback
 * Persistiert den Login-Status im localStorage
 */
class MockAuthService {
  private listeners: Set<(user: User | null) => void> = new Set()
  private currentUserId: string | null = null

  constructor() {
    // Restore user from localStorage on init (client-side only)
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem(STORAGE_KEY)
      if (storedUserId) {
        this.currentUserId = storedUserId
      }
    }
  }

  login(email: string, password: string): User | null {
    const user = dataStore.login(email, password)
    if (user) {
      this.currentUserId = user.id
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, user.id)
      }
    }
    this.notifyListeners(user)
    return user
  }

  logout(): void {
    this.currentUserId = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    dataStore.logout()
    this.notifyListeners(null)
  }

  getCurrentUser(): User | null {
    if (!this.currentUserId) {
      // Try to restore from localStorage
      if (typeof window !== 'undefined') {
        const storedUserId = localStorage.getItem(STORAGE_KEY)
        if (storedUserId) {
          this.currentUserId = storedUserId
        }
      }
    }

    if (this.currentUserId) {
      return dataStore.getUserById(this.currentUserId) || null
    }
    return null
  }

  async getCurrentUserAsync(): Promise<User | null> {
    return this.getCurrentUser()
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener)
    listener(this.getCurrentUser())
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Refresh the current user from the database
   * This is useful after profile updates to sync the user state across components
   */
  async refreshCurrentUser(): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (currentUser) {
      this.notifyListeners(currentUser)
    }
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach((listener) => listener(user))
  }

  async register(email: string, password: string, name: string, token?: string): Promise<User | null> {
    if (token) {
      const user = dataStore.useInvitation(token, name, password)
      if (user) {
        this.currentUserId = user.id
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, user.id)
        }
      }
      return user
    }
    return null
  }

  async resetPassword(email: string): Promise<boolean> {
    // Mock implementation - always returns true
    return true
  }

  async changePassword(newPassword: string): Promise<boolean> {
    // Mock implementation - always returns true
    return true
  }
}

export const mockAuthService = new MockAuthService()
