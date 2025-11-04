import { User } from '../types'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import { dataRepository } from '../data'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export class LoginTimeoutError extends Error {
  constructor(message: string = 'Login timeout') {
    super(message)
    this.name = 'LoginTimeoutError'
  }
}

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
  private loadingProfilePromise: Promise<User | null> | null = null
  private readonly LOGIN_TIMEOUT = 30000 // 30 seconds
  private readonly PROFILE_LOAD_TIMEOUT = 10000 // 10 seconds

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
          if (session?.user) {
            // Always update if user changed or if we don't have a current user
            if (!this.currentUser || this.currentUser.id !== session.user.id) {
            await this.loadUserProfile(session.user.id)
            }
          }
        }
      })

      // Load initial session (fallback, in case onAuthStateChange doesn't fire)
      this.initializeSession()

      // Set up proactive session refresh to prevent expiration
      if (typeof window !== 'undefined') {
        this.setupSessionRefresh()
      }
    }
  }

  private setupSessionRefresh() {
    if (!isSupabaseConfigured || !supabase) return

    // Aggressive refresh strategy for Free Plan where JWT settings can't be changed
    // Check more frequently and refresh earlier to prevent expiration
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // If session is invalid, don't try to refresh
          if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
            return
          }
        }

        if (session) {
          // Check if token is close to expiring (within 15 minutes)
          // This is more aggressive to ensure we refresh before expiration
          const expiresAt = session.expires_at
          if (expiresAt) {
            const now = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = expiresAt - now
            
            // Refresh if token expires in less than 15 minutes (900 seconds)
            // This gives us plenty of buffer time
            if (timeUntilExpiry < 900 && timeUntilExpiry > 0) {
              try {
                const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                if (!refreshError && refreshedSession) {
                  console.log('Session refreshed proactively (time until expiry:', timeUntilExpiry, 's)')
                }
              } catch (refreshError) {
                console.warn('Failed to refresh session:', refreshError)
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - session might be invalid
      }
    }, 2 * 60 * 1000) // Check every 2 minutes (more frequent for Free Plan)

    // Also refresh on user activity (page visibility, focus, etc.)
    if (typeof window !== 'undefined') {
      const refreshOnActivity = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.expires_at) {
            const now = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = session.expires_at - now
            // Refresh if less than 20 minutes remaining
            if (timeUntilExpiry < 1200 && timeUntilExpiry > 0) {
              await supabase.auth.refreshSession()
            }
          }
        } catch (error) {
          // Ignore errors
        }
      }

      // Refresh when page becomes visible again
      document.addEventListener('visibilitychange', refreshOnActivity)
      // Refresh when window regains focus
      window.addEventListener('focus', refreshOnActivity)
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        clearInterval(refreshInterval)
        document.removeEventListener('visibilitychange', refreshOnActivity)
        window.removeEventListener('focus', refreshOnActivity)
      })
    }
  }

  private async initializeSession() {
    if (!isSupabaseConfigured || !supabase || this.isInitializing) {
      return this.initializationPromise
    }

    this.isInitializing = true

    this.initializationPromise = (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          // Don't log 400 errors for invalid sessions - this is expected when user is logged out
          if (error.status !== 400 && error.message !== 'Invalid Refresh Token') {
            console.error('Error initializing session:', error)
          }
          return
        }
        if (session?.user) {
          await this.loadUserProfile(session.user.id)
        }
      } catch (error: any) {
        // Don't log expected errors (invalid tokens, etc.)
        if (error?.status !== 400 && error?.message?.includes('Invalid') === false) {
          console.error('Error initializing session:', error)
        }
      } finally {
        this.isInitializing = false
      }
    })()

    return this.initializationPromise
  }

  private async loadUserProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured) return null

    // Prevent concurrent loads for the same user - reuse existing promise
    if (this.isLoadingProfile && this.loadingProfilePromise) {
      // If we're already loading the same user, return the existing promise
      try {
        const result = await Promise.race([
          this.loadingProfilePromise,
          new Promise<User | null>((resolve) => 
            setTimeout(() => resolve(null), this.PROFILE_LOAD_TIMEOUT)
          )
        ])
        if (result?.id === userId) {
          return result
        }
      } catch (error) {
        // Continue with new load attempt
      }
    }

    // If we already have the correct user loaded, return it immediately
    if (this.currentUser?.id === userId) {
        return this.currentUser
    }

    this.isLoadingProfile = true

    // Create a promise that will be reused if concurrent loads happen
    this.loadingProfilePromise = (async (): Promise<User | null> => {
    try {
        // Add timeout to prevent hanging
        const loadPromise = (async () => {
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
        })()

        const timeoutPromise = new Promise<User | null>((resolve) => {
          setTimeout(() => {
            console.warn('Timeout loading user profile')
            resolve(null)
          }, this.PROFILE_LOAD_TIMEOUT)
        })

        return await Promise.race([loadPromise, timeoutPromise])
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    } finally {
      this.isLoadingProfile = false
        this.loadingProfilePromise = null
    }
    })()

    return await this.loadingProfilePromise
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
      // Sign in with password with timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new LoginTimeoutError('Login timeout: Sign-in request took too long'))
        }, this.LOGIN_TIMEOUT)
      })

      const { data, error } = await Promise.race([signInPromise, timeoutPromise])

      if (error) {
        // Don't log 400 errors for invalid credentials - these are expected
        // Only log unexpected errors
        if (error.status !== 400) {
          console.error('Login error:', error)
        }
        return null
      }

      if (!data.user) {
        return null
      }

      // Wait for session to be established and load user profile
      // We load it directly here to avoid race conditions with authStateChange listener
      // Add timeout to prevent hanging
      const profileLoadPromise = this.loadUserProfile(data.user.id)
      const profileTimeoutPromise = new Promise<User | null>((resolve) => {
        setTimeout(() => {
          console.warn('Timeout loading user profile after login')
          resolve(null)
        }, this.PROFILE_LOAD_TIMEOUT)
      })

      const user = await Promise.race([profileLoadPromise, profileTimeoutPromise])

      return user
    } catch (error: any) {
      // Re-throw timeout errors so they can be handled by the caller
      if (error instanceof LoginTimeoutError) {
        throw error
      }
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout')) {
        throw new LoginTimeoutError(error.message)
      }
      // Don't log expected errors (400 Bad Request for invalid credentials)
      if (error?.status !== 400 && error?.response?.status !== 400) {
        console.error('Login error:', error)
      }
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
      // Check if session is still valid, refresh if needed
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          // Session is invalid, clear user
          this.currentUser = null
          this.notifyListeners(null)
          return null
        }
        
        // Check if session is close to expiring and refresh proactively
        const expiresAt = session.expires_at
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = expiresAt - now
          
          // Refresh if token expires in less than 15 minutes
          // More aggressive for Free Plan where JWT settings can't be changed
          if (timeUntilExpiry < 900 && timeUntilExpiry > 0) {
            try {
              await supabase.auth.refreshSession()
            } catch (refreshError) {
              // If refresh fails, session might be invalid
              console.warn('Failed to refresh session:', refreshError)
            }
          }
        }
      } catch (error) {
        // Session check failed, but user is still loaded
        // Don't clear user unless we're sure session is invalid
      }
      
      return this.currentUser
    }

    try {
      // Try to get session and load profile if we don't have a user yet
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        // Don't log expected errors (invalid tokens, etc.)
        if (error.status !== 400 && error.message !== 'Invalid Refresh Token') {
          console.error('Error getting current user:', error)
        }
        return null
      }
      if (session?.user) {
        await this.loadUserProfile(session.user.id)
        return this.currentUser
      }
    } catch (error: any) {
      // Don't log expected errors
      if (error?.status !== 400 && error?.message?.includes('Invalid') === false) {
        console.error('Error getting current user:', error)
      }
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

      // Determine redirect URL for email confirmation
      // If invitation token exists, redirect to registration page with token
      // Otherwise, redirect to dashboard after confirmation
      const redirectUrl = token 
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://asc-app.vercel.app'}/register/${token}`
        : `${typeof window !== 'undefined' ? window.location.origin : 'https://asc-app.vercel.app'}/dashboard`

      // Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'member', // Default role, can be updated later by admin
          },
          emailRedirectTo: redirectUrl,
          // For invitations, we can skip email confirmation if configured in Supabase
          // The invitation system already validates the email
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
      
      // Auto-confirm email for invited users (trigger handles this, but we wait a bit)
      if (invitation && updatedUser) {
        // Wait for the auto-confirm trigger to run
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

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

  async changePassword(newPassword: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        console.error('Password change error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Password change error:', error)
      return false
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService()

