import { User } from '../types'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import { dataRepository } from '../data'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

/**
 * Supabase Auth Service
 * Verwaltet Authentifizierung über Supabase Auth
 * Lädt User-Profile aus public.users Tabelle
 */
class SupabaseAuthService {
  private listeners: Set<(user: User | null) => void> = new Set()
  private currentUser: User | null = null

  constructor() {
    // Listen to auth state changes
    if (isSupabaseConfigured && supabase) {
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.id) {
          await this.loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null
          this.notifyListeners(null)
        }
      })

      // Load initial session
      this.initializeSession()
    }
  }

  private async initializeSession() {
    if (!isSupabaseConfigured || !supabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await this.loadUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error initializing session:', error)
    }
  }

  private async loadUserProfile(userId: string) {
    if (!isSupabaseConfigured) return

    try {
      const user = await dataRepository.getUserById(userId)
      
      if (user) {
        this.currentUser = user
        this.notifyListeners(user)
      } else {
        // Fallback: Create user profile from auth user if it doesn't exist
        await this.createUserProfileFromAuth(userId)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      this.currentUser = null
      this.notifyListeners(null)
    }
  }

  private async createUserProfileFromAuth(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return

    try {
      // Get auth user details
      const { data: { user: authUser } } = await supabase.auth.getUser(userId)
      if (!authUser) return

      // Create user profile in public.users using direct Supabase call
      // because we need to set the id explicitly
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: authUser.user_metadata?.role || 'member',
          registered: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        // If user already exists (e.g., from trigger), just load it
        const existingUser = await dataRepository.getUserById(userId)
        if (existingUser) {
          this.currentUser = existingUser
          this.notifyListeners(existingUser)
        }
        return
      }

      if (data) {
        const newUser = await dataRepository.getUserById(userId)
        if (newUser) {
          this.currentUser = newUser
          this.notifyListeners(newUser)
        }
      }
    } catch (error) {
      console.error('Error creating user profile from auth:', error)
      this.currentUser = null
      this.notifyListeners(null)
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        return null
      }

      if (data.user) {
        // Wait a bit for session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        // Try to load user profile
        await this.loadUserProfile(data.user.id)
        
        // If still no user, wait a bit more and retry
        if (!this.currentUser) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          await this.loadUserProfile(data.user.id)
        }
        
        return this.currentUser
      }

      return null
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  async logout(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    try {
      await supabase.auth.signOut()
      this.currentUser = null
      this.notifyListeners(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async getCurrentUserAsync(): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    if (this.currentUser) {
      return this.currentUser
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await this.loadUserProfile(session.user.id)
        return this.currentUser
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }

    return null
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener)
    // Immediately notify with current user
    listener(this.currentUser)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach((listener) => listener(user))
  }

  async register(email: string, password: string, name: string, token?: string): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // Get invitation details if token provided
      let invitation = null
      if (token) {
        invitation = await dataRepository.getInvitationByToken(token)
        if (!invitation) {
          console.error('Invalid invitation token')
          return null
        }
      }

      // Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'member', // Default role, can be updated later by admin
          },
        },
      })

      if (authError || !authData.user) {
        console.error('Registration error:', authError)
        return null
      }

      // Wait a bit for the trigger to create the user profile
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update user profile with additional details
      const updates: Partial<User> = {
        name,
      }

      if (invitation) {
        updates.invitedBy = invitation.createdBy
        updates.registrationToken = token
        // Role stays as 'member' by default, can be changed by admin later
      }

      const updatedUser = await dataRepository.updateUser(authData.user.id, updates)

      if (!updatedUser) {
        console.error('Failed to update user profile')
        return null
      }

      // Mark invitation as used if token provided
      if (token && invitation) {
        // The useInvitation method will handle marking it as used
        await dataRepository.useInvitation(token, name, password)
      }

      await this.loadUserProfile(authData.user.id)
      return this.currentUser
    } catch (error) {
      console.error('Registration error:', error)
      return null
    }
  }

  async resetPassword(email: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return false
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      return !error
    } catch (error) {
      console.error('Password reset error:', error)
      return false
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService()

