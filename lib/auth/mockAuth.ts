import { User } from '../types'
import { dataStore } from '../data/mockData'

/**
 * Mock Auth Service
 * Für Entwicklung ohne Supabase oder Fallback
 */
class MockAuthService {
  private listeners: Set<(user: User | null) => void> = new Set()

  login(email: string, password: string): User | null {
    const user = dataStore.login(email, password)
    this.notifyListeners(user)
    return user
  }

  logout(): void {
    dataStore.logout()
    this.notifyListeners(null)
  }

  getCurrentUser(): User | null {
    return dataStore.getCurrentUser()
  }

  async getCurrentUserAsync(): Promise<User | null> {
    return dataStore.getCurrentUser()
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

  private notifyListeners(user: User | null): void {
    this.listeners.forEach((listener) => listener(user))
  }

  async register(email: string, password: string, name: string, token?: string): Promise<User | null> {
    if (token) {
      return dataStore.useInvitation(token, name, password)
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

