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

      // Check if user is active
      if (user && !user.active) {
        // User is deactivated, sign them out
        await this.logout()
        return null
      }

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
      console.error('Error refreshing current user:', error)
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
      // Include registration_token in metadata if invitation exists
      // This allows the trigger to set it immediately and auto-confirm the email
      const signUpOptions: any = {
        data: {
          name,
          role: 'member', // Default role, can be updated later by admin
        },
        emailRedirectTo: redirectUrl,
      }
      
      // If invitation exists, add registration_token to metadata
      // This allows the trigger to set it and auto-confirm the email
      if (token) {
        signUpOptions.data.registration_token = token
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions,
      })

      if (authError || !authData.user) {
        console.error('Registration error:', authError)
        return null
      }

      console.log('User created in auth.users:', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at,
        hasSession: !!authData.session
      })

      // Check if we have a session after signUp
      // If email confirmation is disabled, we should have a session
      // If email confirmation is enabled and we have a token, the trigger should confirm
      let session = authData.session
      
      // If we have a registration token, wait for auto-confirm trigger
      if (token && !session) {
        // Wait for triggers to run
        await new Promise((resolve) => setTimeout(resolve, 2000))
        
        // Check if email was auto-confirmed
        const { data: { user: currentUser } } = await supabase.auth.getUser(authData.user.id)
        if (currentUser?.email_confirmed_at) {
          // Email was confirmed, try to sign in to get session
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (signInData?.session) {
            session = signInData.session
            console.log('Signed in after auto-confirm')
          } else {
            console.warn('Could not sign in after auto-confirm:', signInError)
          }
        }
      }
      
      // Wait a bit more for the trigger to create the user profile
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Try to get the user profile
      // First check if we have a session - if not, we might not be able to read it
      if (!session) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        session = currentSession
      }
      
      console.log('Trying to load user profile:', {
        userId: authData.user.id,
        hasSession: !!session
      })
      
      let userProfile = await dataRepository.getUserById(authData.user.id)
      
      console.log('Profile load result:', {
        hasProfile: !!userProfile,
        userId: authData.user.id
      })
      
      // If profile doesn't exist yet, wait a bit more and try again
      if (!userProfile) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        userProfile = await dataRepository.getUserById(authData.user.id)
        console.log('Profile load after wait:', { hasProfile: !!userProfile })
      }

      // If profile still doesn't exist, try to create it manually
      // This is a fallback if the trigger didn't work
      if (!userProfile) {
        console.log('Profile still not found, trying to create manually...')
        
        // Wait a bit longer for trigger
        await new Promise((resolve) => setTimeout(resolve, 2000))
        userProfile = await dataRepository.getUserById(authData.user.id)
        
        // If still doesn't exist and we have a session, create it manually
        if (!userProfile && session) {
          console.log('Creating profile manually with session')
          try {
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email || email,
                name,
                role: 'member',
                registered: true,
                invited_by: invitation?.createdBy || null,
                registration_token: token || null,
              })
              .select()
              .single()

            if (insertError) {
              // If error is about duplicate, try to load it
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                console.log('Profile already exists (duplicate), loading...')
                await new Promise((resolve) => setTimeout(resolve, 500))
                userProfile = await dataRepository.getUserById(authData.user.id)
              } else {
                console.error('Error creating user profile manually:', JSON.stringify(insertError, null, 2))
              }
            } else if (insertData) {
              console.log('Profile created manually successfully')
              userProfile = await dataRepository.getUserById(authData.user.id)
              
              // If we have a registration token, trigger auto-confirm
              if (token && userProfile) {
                console.log('Updating profile with invitation details and triggering auto-confirm')
                await dataRepository.updateUser(authData.user.id, {
                  registrationToken: token,
                  invitedBy: invitation?.createdBy,
                })
                await new Promise((resolve) => setTimeout(resolve, 500))
              }
            }
          } catch (createError) {
            console.error('Error in manual profile creation:', createError)
          }
        } else if (!userProfile && !session) {
          console.warn('Cannot create profile manually - no session. User may need to confirm email first.', {
            userId: authData.user.id,
            email: authData.user.email
          })
        }
      }

      // If profile exists, try to update it with additional details
      // Note: If email confirmation is required, the user might not be logged in,
      // so updateUser might fail. That's okay - the trigger has set the basic data.
      if (userProfile) {
        // Check if we have a session (user is logged in)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is logged in, we can update
          const updates: Partial<User> = {}
          
          // Only update if values are different
          if (userProfile.name !== name) {
            updates.name = name
          }
          if (!userProfile.registered) {
            updates.registered = true
          }
          
          // Only set active if user profile has the field
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

          // Only try to update if we have updates to make
          if (Object.keys(updates).length > 0) {
            const updatedUser = await dataRepository.updateUser(authData.user.id, updates)
            
            if (updatedUser) {
              userProfile = updatedUser
            } else {
              // Update failed, but profile exists - that's okay
              console.warn('Failed to update user profile, but profile exists', {
                userId: authData.user.id
              })
            }
          }
        } else {
          // User is not logged in (email confirmation required)
          // That's okay - the trigger has created the profile with basic data
          // The user will need to confirm email and login, then we can update
          console.log('User profile created by trigger, but user not logged in (email confirmation required)')
        }
      }

      // If we still don't have a profile, try one more time to load it
      if (!userProfile) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        userProfile = await dataRepository.getUserById(authData.user.id)
      }

      // If we have a profile, load it and return
      if (userProfile) {
        await this.loadUserProfile(authData.user.id)
        // Mark invitation as used if token provided
        if (token && invitation && userProfile) {
          await dataRepository.useInvitation(token, name, password)
        }
        return this.currentUser
      }

      // If we still don't have a profile, try to create it manually
      // This is a fallback if the trigger didn't work
      if (!userProfile) {
        const { data: { session } } = await supabase.auth.getSession()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        // Only try manual creation if we have a session or user is confirmed
        if (session || authUser?.email_confirmed_at) {
          try {
            // Try to create profile using direct Supabase call with session
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email || email,
                name,
                role: 'member',
                registered: true,
                invited_by: invitation?.createdBy || null,
                registration_token: token || null,
              })
              .select()
              .single()

            if (insertError) {
              // If error is about duplicate, try to load it
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                await new Promise((resolve) => setTimeout(resolve, 500))
                userProfile = await dataRepository.getUserById(authData.user.id)
              } else {
                console.error('Error creating user profile manually:', JSON.stringify(insertError, null, 2))
              }
            } else if (insertData) {
              userProfile = await dataRepository.getUserById(authData.user.id)
              
              // If we have a registration token, trigger auto-confirm
              if (token && userProfile) {
                // Update registration_token if not set
                await dataRepository.updateUser(authData.user.id, {
                  registrationToken: token,
                  invitedBy: invitation?.createdBy,
                })
                
                // The auto-confirm trigger should run on UPDATE
                // But we can also manually confirm via the trigger function
                await new Promise((resolve) => setTimeout(resolve, 500))
              }
            }
          } catch (createError) {
            console.error('Error in manual profile creation:', createError)
          }
        } else {
          // User is not confirmed yet - this is expected if email confirmation is enabled
          console.log('User registered but email not confirmed yet. Profile will be created after email confirmation.')
          return null
        }
      }

      // Final check - if we still don't have a profile, something went wrong
      if (!userProfile) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        console.error('Failed to create or load user profile after registration', {
          userId: authData.user.id,
          email,
          emailConfirmed: authUser?.email_confirmed_at || false,
          hasSession: !!(await supabase.auth.getSession()).data.session
        })
        return null
      }

      // If we have a profile, load it and return
      if (userProfile) {
        await this.loadUserProfile(authData.user.id)
        // Mark invitation as used if token provided
        if (token && invitation && userProfile) {
          await dataRepository.useInvitation(token, name, password)
        }
        return this.currentUser
      }

      return null
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

