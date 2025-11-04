import { User } from './types'
import { isSupabaseConfigured } from './supabase/client'
import { supabaseAuthService } from './auth/supabaseAuth'
import { mockAuthService } from './auth/mockAuth'

export interface AuthState {
  user: User | null
  isLoading: boolean
}

/**
 * Unified Auth Service
 * Wählt automatisch zwischen Supabase Auth und Mock Auth
 */
class AuthService {
  private get authImpl() {
    return isSupabaseConfigured ? supabaseAuthService : mockAuthService
  }

  async login(email: string, password: string): Promise<User | null> {
    return this.authImpl.login(email, password)
  }

  logout(): void {
    this.authImpl.logout()
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

