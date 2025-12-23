import { User } from '../types'
import { createClient } from '../supabase/client'

/**
 * Supabase Auth Service
 * Handles authentication using Supabase Auth
 */
class SupabaseAuthService {
    private supabase = createClient()
    private currentUser: User | null = null
    private listeners: ((user: User | null) => void)[] = []

    constructor() {
        // Initialize auth state
        this.initializeAuth()
    }

    private async initializeAuth() {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (session?.user) {
            await this.fetchUserProfile(session.user.id)
        }

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await this.fetchUserProfile(session.user.id)
            } else {
                this.currentUser = null
            }
            this.notifyListeners()
        })
    }

    private async fetchUserProfile(userId: string): Promise<void> {
        const { data: profile, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (profile && !error) {
            this.currentUser = {
                id: profile.id,
                email: profile.email,
                name: profile.name || '',
                role: profile.role as 'admin' | 'leader' | 'member',
                phone: profile.phone || undefined,
                emergencyContact: profile.emergency_contact || undefined,
                profilePhoto: profile.profile_photo || undefined,
                isActive: profile.is_active ?? true,
            }
        }
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.currentUser))
    }

    async login(email: string, password: string): Promise<User | null> {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login error:', error.message)
            return null
        }

        if (data.user) {
            await this.fetchUserProfile(data.user.id)
            this.notifyListeners()
            return this.currentUser
        }

        return null
    }

    async logout(): Promise<void> {
        await this.supabase.auth.signOut()
        this.currentUser = null
        this.notifyListeners()
    }

    getCurrentUser(): User | null {
        return this.currentUser
    }

    async getCurrentUserAsync(): Promise<User | null> {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (session?.user && !this.currentUser) {
            await this.fetchUserProfile(session.user.id)
        }
        return this.currentUser
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null
    }

    subscribe(listener: (user: User | null) => void): () => void {
        this.listeners.push(listener)
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    async refreshCurrentUser(): Promise<void> {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (session?.user) {
            await this.fetchUserProfile(session.user.id)
            this.notifyListeners()
        }
    }

    async register(email: string, password: string, name: string, token?: string): Promise<User | null> {
        // Verify invitation token if provided
        if (token) {
            const { data: invitation, error: invError } = await this.supabase
                .from('invitations')
                .select('*')
                .eq('token', token)
                .eq('used', false)
                .single()

            if (invError || !invitation) {
                console.error('Invalid invitation token')
                return null
            }

            // Mark invitation as used
            await this.supabase
                .from('invitations')
                .update({ used: true })
                .eq('id', invitation.id)
        }

        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        })

        if (error) {
            console.error('Registration error:', error.message)
            return null
        }

        if (data.user) {
            // Wait for the trigger to create the user profile
            await new Promise(resolve => setTimeout(resolve, 500))
            await this.fetchUserProfile(data.user.id)
            this.notifyListeners()
            return this.currentUser
        }

        return null
    }

    async resetPassword(email: string): Promise<boolean> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return !error
    }

    async changePassword(newPassword: string): Promise<boolean> {
        const { error } = await this.supabase.auth.updateUser({
            password: newPassword,
        })
        return !error
    }
}

export const supabaseAuthService = new SupabaseAuthService()
