import { User } from './types'
import { supabaseAuthService } from './auth/supabaseAuth'

export interface AuthState {
  user: User | null
  isLoading: boolean
}

/**
 * Unified Auth Service
 * Now using Supabase Auth for production.
 */
class AuthService {
  private get authImpl() {
    return supabaseAuthService
  }

  async login(email: string, password: string): Promise<User | null> {
    return this.authImpl.login(email, password)
  }

  async logout(): Promise<void> {
    return this.authImpl.logout()
  }

  getCurrentUser(): User | null {
    return this.authImpl.getCurrentUser()
  }

  async getCurrentUserAsync(): Promise<User | null> {
    return this.authImpl.getCurrentUserAsync()
  }

  isAuthenticated(): boolean {
    return this.authImpl.isAuthenticated()
  }

  subscribe(listener: (user: User | null) => void): () => void {
    return this.authImpl.subscribe(listener)
  }

  async refreshCurrentUser(): Promise<void> {
    return this.authImpl.refreshCurrentUser()
  }

  async register(email: string, password: string, name: string, token?: string): Promise<User | null> {
    return this.authImpl.register(email, password, name, token)
  }

  async resetPassword(email: string): Promise<boolean> {
    return this.authImpl.resetPassword(email)
  }

  async changePassword(newPassword: string): Promise<boolean> {
    return this.authImpl.changePassword(newPassword)
  }
}

export const authService = new AuthService()
