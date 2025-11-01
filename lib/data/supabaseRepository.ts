import { IDataRepository } from './repository'
import { User, Tour, ChatMessage, Invitation, TourSettings } from '../types'
import { supabase } from '../supabase/client'

/**
 * Supabase Data Repository Implementation
 * Implementiert IDataRepository mit Supabase als Backend
 */
export class SupabaseDataRepository implements IDataRepository {
  // User Management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
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

    if (error || !data) return null
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
        profile_photo: user.profilePhoto || null,
        phone: user.phone || null,
        mobile: user.mobile || null,
        street: user.street || null,
        zip: user.zip || null,
        city: user.city || null,
      })
      .select()
      .single()

    if (error) throw error
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
    if (updates.profilePhoto !== undefined) updateData.profile_photo = updates.profilePhoto
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.mobile !== undefined) updateData.mobile = updates.mobile
    if (updates.street !== undefined) updateData.street = updates.street
    if (updates.zip !== undefined) updateData.zip = updates.zip
    if (updates.city !== undefined) updateData.city = updates.city

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return null
    return this.mapDbUserToUser(data)
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

    if (error) throw error
    return (data || []).map((row: any) => this.mapDbTourToTour(row))
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
        console.error('Error fetching tour:', error)
        return null
      }
      
      if (!data) return null
      
      return this.mapDbTourToTour(data)
    } catch (error) {
      console.error('Error in getTourById:', error)
      return null
    }
  }

  async getApprovedTours(): Promise<Tour[]> {
    // Alias für getPublishedTours für Rückwärtskompatibilität
    return this.getPublishedTours()
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

    if (error) throw error
    return (data || []).map((row: any) => this.mapDbTourToTour(row))
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

    if (error) throw error
    return (data || []).map((row: any) => this.mapDbTourToTour(row))
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

    if (error) throw error
    return (data || []).map((row: any) => this.mapDbTourToTour(row))
  }

  async createTour(tourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status'>): Promise<Tour> {
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

    if (error) throw error
    
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
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty
    if (updates.tourType !== undefined) updateData.tour_type = updates.tourType
    if (updates.tourLength !== undefined) updateData.tour_length = updates.tourLength
    if (updates.elevation !== undefined) updateData.elevation = updates.elevation
    if (updates.duration !== undefined) updateData.duration = updates.duration
    if (updates.leaderId !== undefined) updateData.leader_id = updates.leaderId
    if (updates.maxParticipants !== undefined) updateData.max_participants = updates.maxParticipants

    const { error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
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

    if (error) throw error
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

    if (error) throw error
    return this.getTourById(id)
  }

  async submitTourForPublishing(id: string): Promise<Tour | null> {
    const { error } = await supabase
      .from('tours')
      .update({ submitted_for_publishing: true })
      .eq('id', id)

    if (error) throw error
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
    const { error } = await supabase
      .from('tour_participants')
      .insert({
        tour_id: tourId,
        user_id: userId,
      })

    return !error
  }

  async unregisterFromTour(tourId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('tour_participants')
      .delete()
      .eq('tour_id', tourId)
      .eq('user_id', userId)

    return !error
  }

  // Chat Messages
  async getMessagesByTourId(tourId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages_with_user')
      .select('*')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true })

    if (error) throw error
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

    if (error) throw error
    
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

    if (error) throw error
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

    if (updateError) throw updateError

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

    if (error) throw error
    return (data || []).map(this.mapDbInvitationToInvitation)
  }

  // Settings
  async getSettings(): Promise<TourSettings> {
    const { data, error } = await supabase
      .from('tour_settings')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    const settings: TourSettings = {
      tourTypes: [],
      tourLengths: [],
      difficulties: {},
    }

    ;(data || []).forEach((row: any) => {
      if (row.setting_type === 'tour_type') {
        settings.tourTypes.push(row.setting_key)
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
    const { error } = await supabase
      .from('tour_settings')
      .insert({
        setting_type: 'tour_type',
        setting_key: type,
        display_order: 0,
      })

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

    return !error
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

    if (error) throw error
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
        profilePhoto: row.profile_photo || undefined,
        phone: row.phone || undefined,
        mobile: row.mobile || undefined,
        street: row.street || undefined,
        zip: row.zip || undefined,
        city: row.city || undefined,
      }
    } catch (error) {
      console.error('Error in mapDbUserToUser:', error)
      throw error
    }
  }

  private mapDbTourToTour(row: any): Tour {
    // Ensure status is valid (fallback to 'draft' if invalid)
    const validStatus = row.status === 'published' ? 'published' : 'draft'
    
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
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedForPublishing: row.submitted_for_publishing === true,
      pendingChanges: row.pending_changes || undefined,
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
}

