import { User } from './types'
import { dataStore } from './data/mockData'

export interface AuthState {
  user: User | null
  isLoading: boolean
}

class AuthService {
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

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach((listener) => listener(user))
  }
}

export const authService = new AuthService()

