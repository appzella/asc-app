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
                if (refreshError && process.env.NODE_ENV === 'development') {
                  console.warn('Failed to refresh session:', refreshError)
                }
              } catch (refreshError) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to refresh session:', refreshError)
                }
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
          if (error.status !== 400 && error.message !== 'Invalid Refresh Token' && process.env.NODE_ENV === 'development') {
            console.error('Error initializing session:', error)
          }
          return
        }
        if (session?.user) {
          await this.loadUserProfile(session.user.id)
        }
      } catch (error: any) {
        // Don't log expected errors (invalid tokens, etc.)
        if (error?.status !== 400 && error?.message?.includes('Invalid') === false && process.env.NODE_ENV === 'development') {
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
        // Check if user is active
        if (!user.active) {
          // User is deactivated, sign them out
          if (isSupabaseConfigured && supabase) {
            await supabase.auth.signOut()
          }
          this.currentUser = null
          this.notifyListeners(null)
          return null
        }
        
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
            if (process.env.NODE_ENV === 'development') {
              console.warn('Timeout loading user profile')
            }
            resolve(null)
          }, this.PROFILE_LOAD_TIMEOUT)
        })

        return await Promise.race([loadPromise, timeoutPromise])
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading user profile:', error)
      }
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
      // Note: active field might not exist yet if migration hasn't been run
      const insertData: any = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: authUser.user_metadata?.role || 'member',
        registered: true,
      }
      
      // Only include active if we can check if column exists
      // For now, try with it and let error handling deal with it
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating user profile from auth:', error)
      }
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
        // Only log unexpected errors in development
        if (error.status !== 400 && process.env.NODE_ENV === 'development') {
          console.error('Login error:', error)
        }
        return null
      }

      if (!data.user) {
        return null
      }

      // Check if email is confirmed
      // If not confirmed, sign out and return null to prevent email enumeration
      // This shows the same generic error as wrong credentials
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut()
        return null
      }

      // Wait for session to be established and load user profile
      // We load it directly here to avoid race conditions with authStateChange listener
      // Add timeout to prevent hanging
      const profileLoadPromise = this.loadUserProfile(data.user.id)
      const profileTimeoutPromise = new Promise<User | null>((resolve) => {
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Timeout loading user profile after login')
          }
          resolve(null)
        }, this.PROFILE_LOAD_TIMEOUT)
      })

      const user = await Promise.race([profileLoadPromise, profileTimeoutPromise])

      // Check if user is active
      if (user && !user.active) {
        // User is deactivated, sign them out
        await this.logout()
        return null
      }

      // If user has a registration_token, this is their first login after email confirmation
      // Mark the invitation as used
      if (user && user.registrationToken) {
        try {
          const invitation = await dataRepository.getInvitationByToken(user.registrationToken)
          if (invitation && !invitation.used) {
            // Mark invitation as used
            await dataRepository.useInvitation(user.registrationToken, user.name, password)
            // Reload user to get updated profile (registrationToken should be cleared)
            await this.loadUserProfile(user.id)
            return this.currentUser
          }
        } catch (error) {
          // If invitation handling fails, continue with login anyway
          if (process.env.NODE_ENV === 'development') {
            console.error('Error handling invitation on login:', error)
          }
        }
      }

      return user
    } catch (error: any) {
      // Re-throw specific errors so they can be handled by the caller
      if (error instanceof LoginTimeoutError) {
        throw error
      }
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout')) {
        throw new LoginTimeoutError(error.message)
      }
      // Don't log expected errors (400 Bad Request for invalid credentials)
      if (error?.status !== 400 && error?.response?.status !== 400 && process.env.NODE_ENV === 'development') {
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error)
      }
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
              if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to refresh session:', refreshError)
              }
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
        if (error.status !== 400 && error.message !== 'Invalid Refresh Token' && process.env.NODE_ENV === 'development') {
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
      if (error?.status !== 400 && error?.message?.includes('Invalid') === false && process.env.NODE_ENV === 'development') {
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

  /**
   * Refresh the current user from the database
   * This is useful after profile updates to sync the user state across components
   */
  async refreshCurrentUser(): Promise<void> {
    if (!this.currentUser) return

    try {
      // Force reload by temporarily clearing the current user
      // This ensures we get fresh data from the database
      const userId = this.currentUser.id
      this.currentUser = null
      
      // Now load the user fresh from the database
      await this.loadUserProfile(userId)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing current user:', error)
      }
    }
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach((listener) => listener(user))
  }

  /**
   * Wait for user profile to be created by database trigger
   * Uses exponential backoff polling instead of fixed timeouts
   */
  private async waitForProfile(userId: string, maxAttempts: number = 3): Promise<User | null> {
    const delays = [250, 500, 1000] // Exponential backoff in ms
    
    for (let attempt = 0; attempt < Math.min(maxAttempts, delays.length); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
      const profile = await dataRepository.getUserById(userId)
      if (profile) {
        return profile
      }
    }
    
    return null
  }

  /**
   * Create user profile manually as fallback if trigger fails
   */
  private async createProfileManually(
    userId: string,
    email: string,
    name: string,
    invitation: any,
    token?: string
  ): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) return null

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role: 'member',
          registered: true,
          invited_by: invitation?.createdBy || null,
          registration_token: token || null,
        })
        .select()
        .single()

      if (insertError) {
        // If duplicate, profile was created by trigger - try to load it
        if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
          return await dataRepository.getUserById(userId)
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating user profile manually:', JSON.stringify(insertError, null, 2))
        }
        return null
      }

      // Profile created, load it
      const profile = await dataRepository.getUserById(userId)
      
      // Update with invitation details if needed
      if (token && profile && invitation) {
        await dataRepository.updateUser(userId, {
          registrationToken: token,
          invitedBy: invitation.createdBy,
        })
        // Return updated profile
        return await dataRepository.getUserById(userId)
      }
      
      return profile
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in manual profile creation:', error)
      }
      return null
    }
  }

  /**
   * Update user profile with additional details if needed
   */
  private async updateProfileIfNeeded(
    userProfile: User,
    name: string,
    invitation: any,
    token?: string
  ): Promise<User> {
    const updates: Partial<User> = {}
    
    if (userProfile.name !== name) {
      updates.name = name
    }
    if (!userProfile.registered) {
      updates.registered = true
    }
    if ('active' in userProfile && userProfile.active !== true) {
      updates.active = true
    }

    if (invitation) {
      if (userProfile.invitedBy !== invitation.createdBy) {
        updates.invitedBy = invitation.createdBy
      }
      if (userProfile.registrationToken !== token) {
        updates.registrationToken = token
      }
    }

    // Only update if we have changes
    if (Object.keys(updates).length > 0) {
      const updatedUser = await dataRepository.updateUser(userProfile.id, updates)
      return updatedUser || userProfile
    }
    
    return userProfile
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
          if (process.env.NODE_ENV === 'development') {
            console.error('Invalid invitation token')
          }
          return null
        }
      }

      // Determine redirect URL for email confirmation
      const redirectUrl = token 
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://asc-app.vercel.app'}/register/${token}`
        : `${typeof window !== 'undefined' ? window.location.origin : 'https://asc-app.vercel.app'}/dashboard`

      // Sign up user in Supabase Auth
      const signUpOptions: any = {
        data: {
          name,
          role: 'member',
        },
        emailRedirectTo: redirectUrl,
      }
      
      if (token) {
        signUpOptions.data.registration_token = token
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions,
      })

      if (authError || !authData.user) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Registration error:', authError)
        }
        return null
      }

      // Check if we have a session (only if email confirmation is disabled)
      // If email confirmation is enabled, we won't have a session until user confirms email
      const session = authData.session

      // If we have a session (email confirmation disabled), create/update profile immediately
      if (session) {
        // Wait for trigger to create profile, then load it
        let userProfile = await this.waitForProfile(authData.user.id)
        
        // If profile still doesn't exist, create it manually
        if (!userProfile) {
          userProfile = await this.createProfileManually(
            authData.user.id,
            authData.user.email || email,
            name,
            invitation,
            token
          )
        }

        if (userProfile) {
          // Update profile with additional details
          userProfile = await this.updateProfileIfNeeded(userProfile, name, invitation, token)
          
          // Load profile and mark invitation as used
          await this.loadUserProfile(authData.user.id)
          if (token && invitation) {
            await dataRepository.useInvitation(token, name, password)
          }
          
          return this.currentUser
        }
      }

      // If no session (email confirmation required), return null
      // The user profile will be created by the trigger, but user needs to confirm email first
      // After email confirmation, user will need to log in, and we'll handle invitation then
      return null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', error)
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Password reset error:', error)
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Password change error:', error)
        }
        return false
      }

      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Password change error:', error)
      }
      return false
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService()

