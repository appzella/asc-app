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
  private isLoadingProfile: boolean = false
  private isInitializing: boolean = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    // Listen to auth state changes
    if (isSupabaseConfigured && supabase) {
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          this.currentUser = null
          this.notifyListeners(null)
        } else if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          // Load profile on initial session (page reload) or token refresh
          // INITIAL_SESSION is fired when Supabase restores the session from localStorage
          // SIGNED_IN is handled by login() function to avoid race conditions
          if (session?.user && !this.currentUser) {
            await this.loadUserProfile(session.user.id)
          }
        }
      })

      // Load initial session (fallback, in case onAuthStateChange doesn't fire)
      this.initializeSession()
    }
  }

  private async initializeSession() {
    if (!isSupabaseConfigured || !supabase || this.isInitializing) {
      return this.initializationPromise
    }

    this.isInitializing = true

    this.initializationPromise = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await this.loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      } finally {
        this.isInitializing = false
      }
    })()

    return this.initializationPromise
  }

  private async loadUserProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured) return null

    // Prevent concurrent loads
    if (this.isLoadingProfile) {
      // Wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (this.currentUser?.id === userId) {
        return this.currentUser
      }
    }

    this.isLoadingProfile = true

    try {
      const user = await dataRepository.getUserById(userId)
      
      if (user) {
        this.currentUser = user
        this.notifyListeners(user)
        return user
      } else {
        // Fallback: Create user profile from auth user if it doesn't exist
        await this.createUserProfileFromAuth(userId)
        return this.currentUser
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    } finally {
      this.isLoadingProfile = false
    }
  }

  private async createUserProfileFromAuth(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return

    try {
      // Get auth user details from session instead of getUser(userId)
      // getUser(userId) requires admin rights or the user to be themselves
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || session.user.id !== userId) {
        // If we don't have a session or wrong user, try to load existing user
        const existingUser = await dataRepository.getUserById(userId)
        if (existingUser) {
          this.currentUser = existingUser
          this.notifyListeners(existingUser)
        }
        return
      }

      const authUser = session.user

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
      // Don't set currentUser to null, try to load existing user instead
      const existingUser = await dataRepository.getUserById(userId)
      if (existingUser) {
        this.currentUser = existingUser
        this.notifyListeners(existingUser)
      }
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        return null
      }

      // Wait for session to be established and load user profile
      // We load it directly here to avoid race conditions with authStateChange listener
      const user = await this.loadUserProfile(data.user.id)

      return user
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

    // Wait for initialization to complete if it's in progress
    if (this.isInitializing && this.initializationPromise) {
      await this.initializationPromise
    }

    if (this.currentUser) {
      return this.currentUser
    }

    try {
      // Try to get session and load profile if we don't have a user yet
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

