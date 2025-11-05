import { IDataRepository } from './repository'
import { User, Tour, ChatMessage, Invitation, TourSettings } from '../types'
import { supabase, isSupabaseConfigured } from '../supabase/client'

/**
 * Supabase Data Repository Implementation
 * Implementiert IDataRepository mit Supabase als Backend
 */
export class SupabaseDataRepository implements IDataRepository {
  /**
   * Prüft, ob ein Supabase-Fehler ein Session-Fehler ist
   * und behandelt diesen entsprechend (Session löschen, zum Login umleiten)
   * @returns true wenn es ein Session-Fehler war (und behandelt wurde), false sonst
   */
  private handleSupabaseError(error: any): boolean {
    if (!error) return false

    // Prüfe auf session_not_found oder ähnliche Auth-Fehler
    const isSessionError = 
      error.code === 'PGRST301' || // JWT expired
      error.message?.includes('session_not_found') ||
      error.message?.includes('JWT expired') ||
      error.message?.includes('Invalid JWT') ||
      (error.status === 401 && error.message?.includes('session'))

    if (isSessionError) {
      console.warn('Session invalid or expired, signing out...', error)
      
      // Session löschen
      if (typeof window !== 'undefined' && supabase) {
        supabase.auth.signOut().catch(() => {
          // Ignore errors during signout
        })
        
        // Zum Login umleiten
        window.location.href = '/login'
      }
      
      return true
    }
    
    return false
  }
  // User Management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      // Wenn Session-Fehler, return leeres Array (wird ohnehin nicht erreicht wegen redirect)
      return []
    }
    return (data || []).map(this.mapDbUserToUser)
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        // Handle session errors
        if (this.handleSupabaseError(error)) {
          return null
        }
        // Only log unexpected errors (not "not found")
        if (error.code !== 'PGRST116') {
          console.error('Error getting user by ID:', error)
        }
        return null
      }
    
      if (!data) return null
    
      try {
        return this.mapDbUserToUser(data)
      } catch (error) {
        console.error('Error mapping user data:', error)
        return null
      }
    } catch (error) {
      console.error('Unexpected error in getUserById:', error)
      return null
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (this.handleSupabaseError(error)) {
        return null
      }
      return null
    }
    if (!data) return null
    return this.mapDbUserToUser(data)
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: user.email,
        name: user.name,
        role: user.role,
        invited_by: user.invitedBy || null,
        registration_token: user.registrationToken || null,
        registered: user.registered,
        active: user.active !== undefined ? user.active : true,
        profile_photo: user.profilePhoto || null,
        phone: user.phone || null,
        mobile: user.mobile || null,
        street: user.street || null,
        zip: user.zip || null,
        city: user.city || null,
      })
      .select()
      .single()

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      throw new Error('Session expired')
    }
    return this.mapDbUserToUser(data)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const updateData: any = {}
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.role !== undefined) updateData.role = updates.role
    if (updates.invitedBy !== undefined) updateData.invited_by = updates.invitedBy
    if (updates.registrationToken !== undefined) updateData.registration_token = updates.registrationToken
    if (updates.registered !== undefined) updateData.registered = updates.registered
    // Only include active field if it's defined (might not exist in DB yet)
    if (updates.active !== undefined) {
      updateData.active = updates.active
    }
    // Handle profilePhoto: null or undefined both set to null (to remove photo)
    if (updates.profilePhoto !== undefined) {
      updateData.profile_photo = updates.profilePhoto ?? null
    }
    // Convert empty strings to null for optional fields
    if (updates.phone !== undefined) updateData.phone = updates.phone === '' ? null : updates.phone
    if (updates.mobile !== undefined) updateData.mobile = updates.mobile === '' ? null : updates.mobile
    if (updates.street !== undefined) updateData.street = updates.street === '' ? null : updates.street
    if (updates.zip !== undefined) updateData.zip = updates.zip === '' ? null : updates.zip
    if (updates.city !== undefined) updateData.city = updates.city === '' ? null : updates.city

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      if (this.handleSupabaseError(error)) {
        return null
      }
      // Log full error object to see what's wrong (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating user:', JSON.stringify(error, null, 2))
        console.error('Error updating user - details:', {
          userId: id,
          updates: updateData,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          fullError: error
        })
      }
      return null
    }
    
    // Check if we got data back
    if (!data || data.length === 0) {
      // Update might have succeeded but RLS prevented us from reading it back
      // Try to load the user separately to verify
      if (process.env.NODE_ENV === 'development') {
        console.warn('Update returned no data, trying to reload user:', id)
      }
      const reloadedUser = await this.getUserById(id)
      if (reloadedUser) {
        return reloadedUser
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Update succeeded but cannot read updated user (possible RLS issue):', id)
      }
      return null
    }
    
    // Use first result if multiple (shouldn't happen, but be safe)
    return this.mapDbUserToUser(data[0])
  }

  // Tours
  async getTours(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours_with_participants')
      .select(`
        *,
        leader:users!leader_id(*)
      `)
      .order('date', { ascending: true })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    
    // Load waitlists for all tours
    const tourIds = (data || []).map((row: any) => row.id)
    const { data: waitlistData } = await supabase
      .from('tour_waitlist')
      .select('tour_id, user_id')
      .in('tour_id', tourIds)
      .order('created_at', { ascending: true })

    // Group waitlist by tour_id
    const waitlistByTour: { [key: string]: string[] } = {}
    if (waitlistData) {
      for (const row of waitlistData) {
        if (!waitlistByTour[row.tour_id]) {
          waitlistByTour[row.tour_id] = []
        }
        waitlistByTour[row.tour_id].push(row.user_id)
      }
    }
    
    return (data || []).map((row: any) => this.mapDbTourToTour(row, waitlistByTour[row.id] || []))
  }

  async getTourById(id: string): Promise<Tour | null> {
    try {
      const { data, error } = await supabase
        .from('tours_with_participants')
        .select(`
          *,
          leader:users!leader_id(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (this.handleSupabaseError(error)) {
          return null
        }
        console.error('Error fetching tour:', error)
        return null
      }
      
      if (!data) return null
      
      // Load waitlist separately
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('tour_waitlist')
        .select('user_id')
        .eq('tour_id', id)
        .order('created_at', { ascending: true })

      if (waitlistError && !this.handleSupabaseError(waitlistError)) {
        console.error('Error fetching waitlist:', waitlistError)
      }

      const waitlist = (waitlistData || []).map((row: any) => row.user_id)
      
      return this.mapDbTourToTour(data, waitlist)
    } catch (error) {
      console.error('Error in getTourById:', error)
      return null
    }
  }

  async getPublishedTours(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours_with_participants')
      .select(`
        *,
        leader:users!leader_id(*)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    
    // Load waitlists for all tours
    const tourIds = (data || []).map((row: any) => row.id)
    const { data: waitlistData } = await supabase
      .from('tour_waitlist')
      .select('tour_id, user_id')
      .in('tour_id', tourIds)
      .order('created_at', { ascending: true })

    // Group waitlist by tour_id
    const waitlistByTour: { [key: string]: string[] } = {}
    if (waitlistData) {
      for (const row of waitlistData) {
        if (!waitlistByTour[row.tour_id]) {
          waitlistByTour[row.tour_id] = []
        }
        waitlistByTour[row.tour_id].push(row.user_id)
      }
    }
    
    return (data || []).map((row: any) => this.mapDbTourToTour(row, waitlistByTour[row.id] || []))
  }

  async getDraftTours(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours_with_participants')
      .select(`
        *,
        leader:users!leader_id(*)
      `)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    
    // Load waitlists for all tours
    const tourIds = (data || []).map((row: any) => row.id)
    const { data: waitlistData } = await supabase
      .from('tour_waitlist')
      .select('tour_id, user_id')
      .in('tour_id', tourIds)
      .order('created_at', { ascending: true })

    // Group waitlist by tour_id
    const waitlistByTour: { [key: string]: string[] } = {}
    if (waitlistData) {
      for (const row of waitlistData) {
        if (!waitlistByTour[row.tour_id]) {
          waitlistByTour[row.tour_id] = []
        }
        waitlistByTour[row.tour_id].push(row.user_id)
      }
    }
    
    return (data || []).map((row: any) => this.mapDbTourToTour(row, waitlistByTour[row.id] || []))
  }

  async getToursSubmittedForPublishing(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours_with_participants')
      .select(`
        *,
        leader:users!leader_id(*)
      `)
      .eq('status', 'draft')
      .eq('submitted_for_publishing', true)
      .order('created_at', { ascending: false })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    
    // Load waitlists for all tours
    const tourIds = (data || []).map((row: any) => row.id)
    const { data: waitlistData } = await supabase
      .from('tour_waitlist')
      .select('tour_id, user_id')
      .in('tour_id', tourIds)
      .order('created_at', { ascending: true })

    // Group waitlist by tour_id
    const waitlistByTour: { [key: string]: string[] } = {}
    if (waitlistData) {
      for (const row of waitlistData) {
        if (!waitlistByTour[row.tour_id]) {
          waitlistByTour[row.tour_id] = []
        }
        waitlistByTour[row.tour_id].push(row.user_id)
      }
    }
    
    return (data || []).map((row: any) => this.mapDbTourToTour(row, waitlistByTour[row.id] || []))
  }

  async createTour(tourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status' | 'waitlist'>): Promise<Tour> {
    const { data, error } = await supabase
      .from('tours')
      .insert({
        title: tourData.title,
        description: tourData.description,
        date: tourData.date.toISOString(),
        difficulty: tourData.difficulty,
        tour_type: tourData.tourType,
        tour_length: tourData.tourLength,
        elevation: tourData.elevation,
        duration: tourData.duration,
        leader_id: tourData.leaderId,
        max_participants: tourData.maxParticipants,
        created_by: tourData.createdBy,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      throw new Error('Session expired')
    }
    
    const createdTour = await this.getTourById(data.id)
    if (!createdTour) throw new Error('Failed to retrieve created tour')
    return createdTour
  }

  async updateTour(id: string, updates: Partial<Tour>, submitForApproval = false): Promise<Tour | null> {
    // Get current tour to check status
    const currentTour = await this.getTourById(id)
    if (!currentTour) return null

    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.date !== undefined) updateData.date = updates.date instanceof Date ? updates.date.toISOString() : updates.date
    // Only update difficulty if it's defined and not empty
    if (updates.difficulty !== undefined && updates.difficulty !== null) {
      const difficultyValue = updates.difficulty as unknown as string
      if (difficultyValue && difficultyValue.trim() !== '') {
        updateData.difficulty = updates.difficulty
      }
    }
    if (updates.tourType !== undefined) updateData.tour_type = updates.tourType
    if (updates.tourLength !== undefined) updateData.tour_length = updates.tourLength
    if (updates.elevation !== undefined) updateData.elevation = updates.elevation
    if (updates.duration !== undefined) updateData.duration = updates.duration
    // Only update leaderId if it's defined and not empty
    if (updates.leaderId !== undefined && updates.leaderId !== '' && updates.leaderId !== null) {
      updateData.leader_id = updates.leaderId
    }
    if (updates.maxParticipants !== undefined) updateData.max_participants = updates.maxParticipants
    if (updates.gpxFile !== undefined) updateData.gpx_file = updates.gpxFile

    const { error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', id)

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return null
    }
    return this.getTourById(id)
  }

  async publishTour(id: string): Promise<Tour | null> {
    const { error } = await supabase
      .from('tours')
      .update({ 
        status: 'published',
        submitted_for_publishing: false,
      })
      .eq('id', id)

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return null
    }
    return this.getTourById(id)
  }

  async unpublishTour(id: string): Promise<Tour | null> {
    const { error } = await supabase
      .from('tours')
      .update({ 
        status: 'draft',
        submitted_for_publishing: false,
      })
      .eq('id', id)

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return null
    }
    return this.getTourById(id)
  }

  async cancelTour(id: string): Promise<Tour | null> {
    const { error } = await supabase
      .from('tours')
      .update({ 
        status: 'cancelled',
        submitted_for_publishing: false,
      })
      .eq('id', id)

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return null
    }
    return this.getTourById(id)
  }

  async submitTourForPublishing(id: string): Promise<Tour | null> {
    const { error } = await supabase
      .from('tours')
      .update({ submitted_for_publishing: true })
      .eq('id', id)

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return null
    }
    return this.getTourById(id)
  }

  async deleteTour(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', id)

    return !error
  }

  async registerForTour(tourId: string, userId: string): Promise<boolean> {
    // Check if tour is published (not draft, cancelled, etc.)
    const tour = await this.getTourById(tourId)
    if (!tour || tour.status !== 'published') {
      return false
    }
    
    // Prüfe ob Tour archiviert ist (Datum in der Vergangenheit)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tourDate = new Date(tour.date)
    tourDate.setHours(0, 0, 0, 0)
    if (tourDate < today) {
      return false
    }
    
    // Prüfe ob bereits Teilnehmer oder auf Warteliste
    if (tour.participants.includes(userId) || tour.waitlist.includes(userId)) {
      return false
    }
    
    // Wenn Tour voll ist, zur Warteliste hinzufügen
    if (tour.participants.length >= tour.maxParticipants) {
      const { error } = await supabase
        .from('tour_waitlist')
        .insert({
          tour_id: tourId,
          user_id: userId,
        })
      return !error
    }
    
    // Sonst als Teilnehmer hinzufügen
    const { error } = await supabase
      .from('tour_participants')
      .insert({
        tour_id: tourId,
        user_id: userId,
      })

    return !error
  }

  async unregisterFromTour(tourId: string, userId: string): Promise<boolean> {
    // Hole aktuelle Tour-Daten
    const tour = await this.getTourById(tourId)
    if (!tour) {
      return false
    }
    
    // Entferne Teilnehmer
    const { error: deleteError } = await supabase
      .from('tour_participants')
      .delete()
      .eq('tour_id', tourId)
      .eq('user_id', userId)

    if (deleteError) {
      return false
    }
    
    // Automatisches Nachrücken: Wenn noch Platz unter maxParticipants und Warteliste vorhanden
    if (tour.participants.length - 1 < tour.maxParticipants && tour.waitlist.length > 0) {
      // Hole ersten Eintrag von der Warteliste (ältestes created_at)
      const { data: firstWaitlistEntry, error: waitlistError } = await supabase
        .from('tour_waitlist')
        .select('user_id')
        .eq('tour_id', tourId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (!waitlistError && firstWaitlistEntry) {
        // Entferne von Warteliste
        await supabase
          .from('tour_waitlist')
          .delete()
          .eq('tour_id', tourId)
          .eq('user_id', firstWaitlistEntry.user_id)

        // Füge als Teilnehmer hinzu
        await supabase
          .from('tour_participants')
          .insert({
            tour_id: tourId,
            user_id: firstWaitlistEntry.user_id,
          })
      }
    }

    return true
  }

  // Chat Messages
  async getMessagesByTourId(tourId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages_with_user')
      .select('*')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    return (data || []).map((row: any) => this.mapDbMessageToMessage(row))
  }

  async addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        tour_id: message.tourId,
        user_id: message.userId,
        message: message.message,
      })
      .select()
      .single()

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      throw new Error('Session expired')
    }
    
    // Get user info
    const user = await this.getUserById(message.userId)
    return {
      id: data.id,
      tourId: data.tour_id,
      userId: data.user_id,
      message: data.message,
      createdAt: new Date(data.created_at),
      user: user || undefined,
    }
  }

  // Invitations
  async createInvitation(email: string, createdBy: string): Promise<Invitation> {
    const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email,
        token,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      throw new Error('Session expired')
    }
    return this.mapDbInvitationToInvitation(data)
  }

  async getInvitationByToken(token: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (error || !data) return null
    return this.mapDbInvitationToInvitation(data)
  }

  async useInvitation(token: string, name: string, password: string): Promise<User | null> {
    const invitation = await this.getInvitationByToken(token)
    if (!invitation) return null

    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (updateError) {
      if (!this.handleSupabaseError(updateError)) {
        throw updateError
      }
      return null
    }

    // Update user
    const user = await this.getUserByEmail(invitation.email)
    if (!user) return null

    return this.updateUser(user.id, {
      name,
      registered: true,
      registrationToken: undefined,
    })
  }

  async getInvitations(): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    return (data || []).map(this.mapDbInvitationToInvitation)
  }

  // Settings
  async getSettings(): Promise<TourSettings> {
    const { data, error } = await supabase
      .from('tour_settings')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      // Return empty settings if session error
      return {
        tourTypes: [],
        tourLengths: [],
        difficulties: {},
        tourTypeIcons: {},
      }
    }

    const settings: TourSettings = {
      tourTypes: [],
      tourLengths: [],
      difficulties: {},
      tourTypeIcons: {},
    }

    ;(data || []).forEach((row: any) => {
      if (row.setting_type === 'tour_type') {
        settings.tourTypes.push(row.setting_key)
        if (row.icon_name) {
          settings.tourTypeIcons![row.setting_key] = row.icon_name
        }
      } else if (row.setting_type === 'tour_length') {
        settings.tourLengths.push(row.setting_key)
      } else if (row.setting_type === 'difficulty') {
        const tourType = row.setting_value || 'unknown'
        if (!settings.difficulties[tourType]) {
          settings.difficulties[tourType] = []
        }
        settings.difficulties[tourType].push(row.setting_key)
      }
    })

    return settings
  }

  async updateSettings(updates: Partial<TourSettings>): Promise<TourSettings> {
    // This is a complex operation - for now, we'll update individual settings
    // A more sophisticated implementation would batch updates
    if (updates.tourTypes) {
      // Remove old types and add new ones
      // Implementation would need to track changes
    }
    return this.getSettings()
  }

  async addTourType(type: string): Promise<boolean> {
    // Set default icon based on type
    const defaultIcons: { [key: string]: string } = {
      Wanderung: 'Mountain',
      Skitour: 'Ski',
      Bike: 'Bike',
    }
    const defaultIcon = defaultIcons[type] || 'Mountain'

    const { error } = await supabase
      .from('tour_settings')
      .insert({
        setting_type: 'tour_type',
        setting_key: type,
        icon_name: defaultIcon,
        display_order: 0,
      })

    return !error
  }

  async updateTourTypeIcon(tourType: string, iconName: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_settings')
      .update({ icon_name: iconName })
      .eq('setting_type', 'tour_type')
      .eq('setting_key', tourType)

    return !error
  }

  async removeTourType(type: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_settings')
      .delete()
      .eq('setting_type', 'tour_type')
      .eq('setting_key', type)

    return !error
  }

  async addTourLength(length: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_settings')
      .insert({
        setting_type: 'tour_length',
        setting_key: length,
        display_order: 0,
      })

    return !error
  }

  async removeTourLength(length: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_settings')
      .delete()
      .eq('setting_type', 'tour_length')
      .eq('setting_key', length)

    return !error
  }

  async updateTourTypesOrder(orderedTypes: string[]): Promise<void> {
    // Update display_order for each type
    for (let i = 0; i < orderedTypes.length; i++) {
      await supabase
        .from('tour_settings')
        .update({ display_order: i })
        .eq('setting_type', 'tour_type')
        .eq('setting_key', orderedTypes[i])
    }
  }

  async updateTourLengthsOrder(orderedLengths: string[]): Promise<void> {
    for (let i = 0; i < orderedLengths.length; i++) {
      await supabase
        .from('tour_settings')
        .update({ display_order: i })
        .eq('setting_type', 'tour_length')
        .eq('setting_key', orderedLengths[i])
    }
  }

  async addDifficulty(tourType: string, difficulty: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_settings')
      .insert({
        setting_type: 'difficulty',
        setting_key: difficulty,
        setting_value: tourType,
        display_order: 0,
      })

    return !error
  }

  async removeDifficulty(tourType: string, difficulty: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_settings')
      .delete()
      .eq('setting_type', 'difficulty')
      .eq('setting_key', difficulty)
      .eq('setting_value', tourType)

    if (error) {
      this.handleSupabaseError(error)
      return false
    }
    return true
  }

  async updateDifficultiesOrder(tourType: string, orderedDifficulties: string[]): Promise<void> {
    for (let i = 0; i < orderedDifficulties.length; i++) {
      await supabase
        .from('tour_settings')
        .update({ display_order: i })
        .eq('setting_type', 'difficulty')
        .eq('setting_key', orderedDifficulties[i])
        .eq('setting_value', tourType)
    }
  }

  async getDifficultiesForTourType(tourType: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('tour_settings')
      .select('setting_key')
      .eq('setting_type', 'difficulty')
      .eq('setting_value', tourType)
      .order('display_order', { ascending: true })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }
    return (data || []).map((row: any) => row.setting_key)
  }

  // Helper methods for mapping database rows to TypeScript types
  private mapDbUserToUser(row: any): User {
    try {
      // Validate required fields (allow empty strings for name)
      if (!row.id || !row.email || !row.role) {
        throw new Error('Missing required user fields')
      }

      return {
        id: row.id,
        email: row.email,
        name: row.name || '', // Allow empty string, use fallback
        role: row.role,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        invitedBy: row.invited_by || undefined,
        registrationToken: row.registration_token || undefined,
        registered: row.registered ?? true,
        active: row.active ?? true, // Default to true if not set (for backward compatibility)
        profilePhoto: row.profile_photo || undefined,
        // Convert empty strings and null to undefined for optional fields
        phone: row.phone && row.phone.trim() !== '' ? row.phone : undefined,
        mobile: row.mobile && row.mobile.trim() !== '' ? row.mobile : undefined,
        street: row.street && row.street.trim() !== '' ? row.street : undefined,
        zip: row.zip && row.zip.trim() !== '' ? row.zip : undefined,
        city: row.city && row.city.trim() !== '' ? row.city : undefined,
      }
    } catch (error) {
      console.error('Error in mapDbUserToUser:', error)
      throw error
    }
  }

  private mapDbTourToTour(row: any, waitlist: string[] = []): Tour {
    // Ensure status is valid (fallback to 'draft' if invalid)
    const validStatus = ['draft', 'published', 'cancelled'].includes(row.status) 
      ? row.status 
      : 'draft'
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      date: new Date(row.date),
      difficulty: row.difficulty,
      tourType: row.tour_type,
      tourLength: row.tour_length,
      elevation: row.elevation,
      duration: row.duration,
      leaderId: row.leader_id,
      leader: row.leader ? this.mapDbUserToUser(row.leader) : undefined,
      maxParticipants: row.max_participants,
      status: validStatus,
      participants: row.participant_ids || [],
      waitlist: waitlist,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedForPublishing: row.submitted_for_publishing === true,
      pendingChanges: row.pending_changes || undefined,
      gpxFile: row.gpx_file || null,
    }
  }

  private mapTourToDbTour(tour: Partial<Tour>): any {
    const dbTour: any = {}
    if (tour.title !== undefined) dbTour.title = tour.title
    if (tour.description !== undefined) dbTour.description = tour.description
    if (tour.date !== undefined) dbTour.date = tour.date instanceof Date ? tour.date.toISOString() : tour.date
    if (tour.difficulty !== undefined) dbTour.difficulty = tour.difficulty
    if (tour.tourType !== undefined) dbTour.tour_type = tour.tourType
    if (tour.tourLength !== undefined) dbTour.tour_length = tour.tourLength
    if (tour.elevation !== undefined) dbTour.elevation = tour.elevation
    if (tour.duration !== undefined) dbTour.duration = tour.duration
    if (tour.leaderId !== undefined) dbTour.leader_id = tour.leaderId
    if (tour.maxParticipants !== undefined) dbTour.max_participants = tour.maxParticipants
    if (tour.gpxFile !== undefined) dbTour.gpx_file = tour.gpxFile
    return dbTour
  }

  private mapDbMessageToMessage(row: any): ChatMessage {
    return {
      id: row.id,
      tourId: row.tour_id,
      userId: row.user_id,
      message: row.message,
      createdAt: new Date(row.created_at),
      user: row.user_name ? {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        role: 'member' as const,
        createdAt: new Date(),
        registered: true,
        active: row.user_active !== undefined ? row.user_active : true,
        profilePhoto: row.user_profile_photo || undefined,
      } : undefined,
    }
  }

  private mapDbInvitationToInvitation(row: any): Invitation {
    return {
      id: row.id,
      email: row.email,
      token: row.token,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      used: row.used,
      usedAt: row.used_at ? new Date(row.used_at) : undefined,
    }
  }

  /**
   * Upload profile photo to Supabase Storage
   * @param userId User ID
   * @param file File to upload
   * @returns Public URL of uploaded image
   */
  async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `profile-photos/${fileName}`

    // Upload file to Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      if (this.handleSupabaseError(error)) {
        throw new Error('Session expired')
      }
      console.error('Error uploading profile photo:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  /**
   * Upload GPX file to Supabase Storage
   * @param tourId Tour ID
   * @param file GPX file to upload
   * @returns Public URL of uploaded GPX file
   */
  async uploadGpxFile(tourId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }

    // Validate file type
    const validExtensions = ['gpx', 'xml']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !validExtensions.includes(fileExt)) {
      throw new Error('Ungültiger Dateityp. Nur GPX-Dateien sind erlaubt.')
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Die Datei ist zu groß. Bitte wähle eine Datei unter 10MB.')
    }

    // Generate unique filename
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `gpx/${tourId}/${fileName}`

    // Determine correct MIME type
    const mimeType = fileExt === 'gpx' 
      ? 'application/gpx+xml' 
      : 'application/xml'

    // Upload file to Storage
    const { data, error } = await supabase.storage
      .from('gpx-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      })

    if (error) {
      if (this.handleSupabaseError(error)) {
        throw new Error('Session expired')
      }
      console.error('Error uploading GPX file:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gpx-files')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  /**
   * Delete GPX file from Supabase Storage
   * @param gpxUrl URL of the GPX file to delete
   */
  async deleteGpxFile(gpxUrl: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/gpx-files/gpx/[tourId]/[filename]
    try {
      const urlParts = gpxUrl.split('/gpx-files/')
      if (urlParts.length !== 2) {
        console.error('Invalid GPX URL format:', gpxUrl)
        return
      }

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('gpx-files')
        .remove([filePath])

      if (error && !this.handleSupabaseError(error)) {
        console.error('Error deleting GPX file:', error)
      }
    } catch (error) {
      console.error('Error parsing GPX URL:', error)
    }
  }

  /**
   * Delete profile photo from Supabase Storage
   * @param photoUrl URL of the photo to delete
   */
  async deleteProfilePhoto(photoUrl: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/profile-photos/[userId]/[filename]
    try {
      const urlParts = photoUrl.split('/avatars/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        const { error: removeError } = await supabase.storage
          .from('avatars')
          .remove([filePath])
        
        if (removeError) {
          this.handleSupabaseError(removeError)
          // Don't throw - deletion is not critical
        }
      }
    } catch (error: any) {
      console.error('Error deleting profile photo:', error)
      this.handleSupabaseError(error)
      // Don't throw - deletion is not critical
    }
  }

  // Waitlist Management
  async addToWaitlist(tourId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_waitlist')
      .insert({
        tour_id: tourId,
        user_id: userId,
      })

    return !error
  }

  async removeFromWaitlist(tourId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_waitlist')
      .delete()
      .eq('tour_id', tourId)
      .eq('user_id', userId)

    return !error
  }

  async getWaitlistByTourId(tourId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('tour_waitlist')
      .select(`
        user_id,
        users(*)
      `)
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true })

    if (error) {
      if (!this.handleSupabaseError(error)) {
        throw error
      }
      return []
    }

    return (data || [])
      .map((row: any) => row.users ? this.mapDbUserToUser(row.users) : null)
      .filter((user: User | null): user is User => user !== null)
  }

  async promoteFromWaitlist(tourId: string, userId: string): Promise<boolean> {
    // Prüfe ob User auf Warteliste ist
    const { data: waitlistEntry, error: checkError } = await supabase
      .from('tour_waitlist')
      .select('*')
      .eq('tour_id', tourId)
      .eq('user_id', userId)
      .single()

    if (checkError || !waitlistEntry) {
      return false
    }

    // Entferne von Warteliste
    const { error: deleteError } = await supabase
      .from('tour_waitlist')
      .delete()
      .eq('tour_id', tourId)
      .eq('user_id', userId)

    if (deleteError) {
      return false
    }

    // Füge als Teilnehmer hinzu (auch wenn Tour bereits voll ist)
    const { error: insertError } = await supabase
      .from('tour_participants')
      .insert({
        tour_id: tourId,
        user_id: userId,
      })

    return !insertError
  }

  async addParticipantManually(tourId: string, userId: string): Promise<boolean> {
    // Prüfe ob Tour existiert
    const tour = await this.getTourById(tourId)
    if (!tour || tour.status !== 'published') {
      return false
    }

    // Prüfe ob bereits Teilnehmer
    if (tour.participants.includes(userId)) {
      return false
    }

    // Prüfe ob auf Warteliste - wenn ja, entferne von dort
    if (tour.waitlist.includes(userId)) {
      const { error: deleteError } = await supabase
        .from('tour_waitlist')
        .delete()
        .eq('tour_id', tourId)
        .eq('user_id', userId)

      if (deleteError) {
        return false
      }
    }

    // Füge als Teilnehmer hinzu (auch wenn Tour bereits voll ist)
    const { error: insertError } = await supabase
      .from('tour_participants')
      .insert({
        tour_id: tourId,
        user_id: userId,
      })

    return !insertError
  }
}

