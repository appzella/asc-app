import { createClient } from '../supabase/client'
import { User, Tour, Invitation, TourSettings, TourType, TourLength, Notification, NotificationType } from '../types'
import { IDataRepository } from './repository'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Data Repository Implementation
 */
export class SupabaseRepository implements IDataRepository {
    private supabase: SupabaseClient

    constructor(client?: SupabaseClient) {
        this.supabase = client || createClient()
    }

    // ====== USER MANAGEMENT ======

    async getUsers(): Promise<User[]> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .order('name')

        if (error) {
            console.error('Error fetching users:', error)
            return []
        }

        return data.map(this.mapDbUserToUser)
    }

    async getUserById(id: string): Promise<User | null> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null
        return this.mapDbUserToUser(data)
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error) return null
        return this.mapDbUserToUser(data)
    }

    async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        const { data, error } = await this.supabase
            .from('users')
            .insert({
                email: user.email,
                name: user.name,
                role: user.role || 'member',
                phone: user.phone,
                emergency_contact: user.emergencyContact,
                profile_photo: user.profilePhoto,
                is_active: user.isActive ?? true,
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return this.mapDbUserToUser(data)
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.role !== undefined) dbUpdates.role = updates.role
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone
        if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile
        if (updates.street !== undefined) dbUpdates.street = updates.street
        if (updates.zip !== undefined) dbUpdates.zip = updates.zip
        if (updates.city !== undefined) dbUpdates.city = updates.city
        if (updates.emergencyContact !== undefined) dbUpdates.emergency_contact = updates.emergencyContact
        if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
        // User settings
        if (updates.theme !== undefined) dbUpdates.theme = updates.theme
        if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications
        if (updates.pushNotifications !== undefined) dbUpdates.push_notifications = updates.pushNotifications
        dbUpdates.updated_at = new Date().toISOString()

        const { data, error } = await this.supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating user:', JSON.stringify(error, null, 2))
            return null
        }
        return this.mapDbUserToUser(data)
    }

    private mapDbUserToUser(db: Record<string, unknown>): User {
        return {
            id: db.id as string,
            email: db.email as string,
            name: db.name as string || '',
            role: (db.role as 'admin' | 'leader' | 'member') || 'member',
            phone: db.phone as string | undefined,
            mobile: db.mobile as string | undefined,
            street: db.street as string | undefined,
            zip: db.zip as string | undefined,
            city: db.city as string | undefined,
            emergencyContact: db.emergency_contact as string | undefined,
            profilePhoto: db.profile_photo as string | undefined,
            isActive: db.is_active as boolean ?? true,
            createdAt: db.created_at as string,
            // User settings
            theme: db.theme as 'light' | 'dark' | 'system' | undefined,
            emailNotifications: db.email_notifications as boolean ?? true,
            pushNotifications: db.push_notifications as boolean ?? true,
        }
    }

    // ====== TOURS ======

    async getTours(): Promise<Tour[]> {
        const { data: tours, error } = await this.supabase
            .from('tours')
            .select(`
                *,
                tour_participants(user_id, is_waitlist),
                leader:users!leader_id(*),
                tour_type:tour_types!tour_type_id(id, name, label),
                tour_length:tour_lengths!tour_length_id(id, name, label),
                tour_difficulty:tour_difficulties!difficulty_id(id, name)
            `)
            .order('date', { ascending: true })

        if (error) {
            console.error('Error fetching tours:', JSON.stringify(error, null, 2))
            return []
        }

        return Promise.all(tours.map(t => this.mapDbTourToTour(t)))
    }

    async getTourById(id: string): Promise<Tour | null> {
        const { data, error } = await this.supabase
            .from('tours')
            .select(`
                *,
                tour_participants(user_id, is_waitlist),
                leader:users!leader_id(*),
                tour_type:tour_types!tour_type_id(id, name, label),
                tour_length:tour_lengths!tour_length_id(id, name, label),
                tour_difficulty:tour_difficulties!difficulty_id(id, name)
            `)
            .eq('id', id)
            .single()

        if (error) return null
        return this.mapDbTourToTour(data)
    }

    async getPublishedTours(): Promise<Tour[]> {
        const { data, error } = await this.supabase
            .from('tours')
            .select(`
                *,
                tour_participants(user_id, is_waitlist),
                leader:users!leader_id(*),
                tour_type:tour_types!tour_type_id(id, name, label),
                tour_length:tour_lengths!tour_length_id(id, name, label),
                tour_difficulty:tour_difficulties!difficulty_id(id, name)
            `)
            .eq('status', 'published')
            .order('date', { ascending: true })

        if (error) return []
        return Promise.all(data.map(t => this.mapDbTourToTour(t)))
    }

    async getDraftTours(): Promise<Tour[]> {
        const { data, error } = await this.supabase
            .from('tours')
            .select(`
                *,
                tour_participants(user_id, is_waitlist),
                tour_type:tour_types!tour_type_id(id, name, label),
                tour_length:tour_lengths!tour_length_id(id, name, label),
                tour_difficulty:tour_difficulties!difficulty_id(id, name)
            `)
            .eq('status', 'draft')
            .order('date', { ascending: true })

        if (error) return []
        return Promise.all(data.map(t => this.mapDbTourToTour(t)))
    }

    async getToursSubmittedForPublishing(): Promise<Tour[]> {
        // Not implemented - would need additional status
        return []
    }

    async createTour(tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status' | 'waitlist'>): Promise<Tour> {
        // Look up IDs from labels
        const tourTypeId = await this.getTourTypeIdByLabel(tour.type)
        const tourLengthId = tour.length ? await this.getTourLengthIdByLabel(tour.length) : null
        const difficultyId = tour.difficulty && tourTypeId
            ? await this.getDifficultyIdByName(tourTypeId, tour.difficulty)
            : null

        const { data, error } = await this.supabase
            .from('tours')
            .insert({
                title: tour.title,
                description: tour.description,
                date: tour.date,
                time: tour.time,
                tour_type_id: tourTypeId,
                difficulty_id: difficultyId,
                tour_length_id: tourLengthId,
                peak: tour.peak,
                peak_elevation: tour.peakElevation,
                ascent: tour.ascent,
                descent: tour.descent,
                duration_min: tour.durationMin,
                duration_max: tour.durationMax,
                max_participants: tour.maxParticipants,
                meeting_point: tour.meetingPoint,
                meeting_point_link: tour.meetingPointLink,
                gpx_url: tour.gpxFile,
                whatsapp_link: tour.whatsappLink,
                leader_id: tour.leaderId,
                status: 'published',
            })
            .select(`
                *,
                tour_type:tour_types!tour_type_id(id, name, label),
                tour_length:tour_lengths!tour_length_id(id, name, label),
                tour_difficulty:tour_difficulties!difficulty_id(id, name)
            `)
            .single()

        if (error) throw new Error(error.message)
        return this.mapDbTourToTour(data)
    }

    async updateTour(id: string, updates: Partial<Tour>): Promise<Tour | null> {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.description !== undefined) dbUpdates.description = updates.description
        if (updates.date !== undefined) dbUpdates.date = updates.date
        if (updates.time !== undefined) dbUpdates.time = updates.time

        // Handle type update - look up tour_type_id
        if (updates.type !== undefined) {
            const tourTypeId = await this.getTourTypeIdByLabel(updates.type)
            if (tourTypeId) dbUpdates.tour_type_id = tourTypeId
        }

        // Handle difficulty update - need tourTypeId to look up difficulty_id
        if (updates.difficulty !== undefined) {
            // Get current tour to find its type
            const currentTour = await this.getTourById(id)
            if (currentTour) {
                const tourTypeId = await this.getTourTypeIdByLabel(updates.type || currentTour.type)
                if (tourTypeId) {
                    const difficultyId = await this.getDifficultyIdByName(tourTypeId, updates.difficulty)
                    if (difficultyId) dbUpdates.difficulty_id = difficultyId
                }
            }
        }

        // Handle length update - look up tour_length_id
        if (updates.length !== undefined) {
            const tourLengthId = await this.getTourLengthIdByLabel(updates.length)
            if (tourLengthId) dbUpdates.tour_length_id = tourLengthId
        }

        if (updates.peak !== undefined) dbUpdates.peak = updates.peak
        if (updates.peakElevation !== undefined) dbUpdates.peak_elevation = updates.peakElevation
        if (updates.ascent !== undefined) dbUpdates.ascent = updates.ascent
        if (updates.descent !== undefined) dbUpdates.descent = updates.descent
        if (updates.durationMin !== undefined) dbUpdates.duration_min = updates.durationMin
        if (updates.durationMax !== undefined) dbUpdates.duration_max = updates.durationMax
        if (updates.maxParticipants !== undefined) dbUpdates.max_participants = updates.maxParticipants
        if (updates.meetingPoint !== undefined) dbUpdates.meeting_point = updates.meetingPoint
        if (updates.meetingPointLink !== undefined) dbUpdates.meeting_point_link = updates.meetingPointLink
        if (updates.gpxFile !== undefined) dbUpdates.gpx_url = updates.gpxFile
        if (updates.whatsappLink !== undefined) dbUpdates.whatsapp_link = updates.whatsappLink
        if (updates.status !== undefined) dbUpdates.status = updates.status
        dbUpdates.updated_at = new Date().toISOString()

        const { data, error } = await this.supabase
            .from('tours')
            .update(dbUpdates)
            .eq('id', id)
            .select(`
                *,
                tour_type:tour_types!tour_type_id(id, name, label),
                tour_length:tour_lengths!tour_length_id(id, name, label),
                tour_difficulty:tour_difficulties!difficulty_id(id, name)
            `)
            .single()

        if (error) return null
        return this.mapDbTourToTour(data)
    }

    async publishTour(id: string): Promise<Tour | null> {
        return this.updateTour(id, { status: 'published' })
    }

    async unpublishTour(id: string): Promise<Tour | null> {
        return this.updateTour(id, { status: 'draft' })
    }

    async cancelTour(id: string): Promise<Tour | null> {
        return this.updateTour(id, { status: 'cancelled' })
    }

    async deleteTour(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tours')
            .delete()
            .eq('id', id)
        return !error
    }

    // ====== TOUR PARTICIPANTS ======

    async registerForTour(tourId: string, userId: string): Promise<boolean> {
        // Check if tour is full
        const tour = await this.getTourById(tourId)
        if (!tour) return false

        const isFull = tour.participants.length >= (tour.maxParticipants || 10)

        const { error } = await this.supabase
            .from('tour_participants')
            .insert({
                tour_id: tourId,
                user_id: userId,
                is_waitlist: isFull,
            })

        return !error
    }

    async unregisterFromTour(tourId: string, userId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_participants')
            .delete()
            .eq('tour_id', tourId)
            .eq('user_id', userId)

        return !error
    }

    async addParticipantManually(tourId: string, userId: string): Promise<boolean> {
        return this.registerForTour(tourId, userId)
    }

    // ====== WAITLIST ======

    async addToWaitlist(tourId: string, userId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_participants')
            .insert({
                tour_id: tourId,
                user_id: userId,
                is_waitlist: true,
            })
        return !error
    }

    async removeFromWaitlist(tourId: string, userId: string): Promise<boolean> {
        return this.unregisterFromTour(tourId, userId)
    }

    async getWaitlistByTourId(tourId: string): Promise<User[]> {
        const { data, error } = await this.supabase
            .from('tour_participants')
            .select('user_id, users(*)')
            .eq('tour_id', tourId)
            .eq('is_waitlist', true)

        if (error || !data) return []
        return data.map((p: Record<string, unknown>) => this.mapDbUserToUser(p.users as Record<string, unknown>))
    }

    async promoteFromWaitlist(tourId: string, userId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_participants')
            .update({ is_waitlist: false })
            .eq('tour_id', tourId)
            .eq('user_id', userId)
        return !error
    }

    // ====== INVITATIONS ======

    async createInvitation(email: string, createdBy: string): Promise<Invitation> {
        const { data, error } = await this.supabase
            .from('invitations')
            .insert({
                email,
                created_by: createdBy,
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return this.mapDbInvitationToInvitation(data)
    }

    async getInvitationByToken(token: string): Promise<Invitation | null> {
        const { data, error } = await this.supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single()

        if (error) return null
        return this.mapDbInvitationToInvitation(data)
    }

    async useInvitation(_token: string, _name: string, _password: string): Promise<User | null> {
        // This is handled by the auth service now
        return null
    }

    async getInvitations(): Promise<Invitation[]> {
        const { data, error } = await this.supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) return []
        return data.map(this.mapDbInvitationToInvitation)
    }

    private mapDbInvitationToInvitation(db: Record<string, unknown>): Invitation {
        return {
            id: db.id as string,
            email: db.email as string,
            token: db.token as string,
            used: db.used as boolean,
            createdBy: db.created_by as string,
            createdAt: db.created_at as string,
        }
    }

    // ====== SETTINGS (Tour Types & Lengths) ======

    async getSettings(): Promise<TourSettings> {
        const [typesRes, lengthsRes, difficultiesRes] = await Promise.all([
            this.supabase.from('tour_types').select('*').order('sort_order'),
            this.supabase.from('tour_lengths').select('*').order('sort_order'),
            this.supabase.from('tour_difficulties').select('*, tour_types!inner(label)').order('sort_order'),
        ])

        // Return as string arrays for backward compatibility with admin pages
        const tourTypes: string[] = (typesRes.data || []).map((t: Record<string, unknown>) => t.label as string)
        const tourLengths: string[] = (lengthsRes.data || []).map((l: Record<string, unknown>) => l.label as string)

        // Build difficulties map by tour type label
        const difficulties: { [tourType: string]: string[] } = {}
        for (const diff of (difficultiesRes.data || [])) {
            const tourTypeLabel = (diff.tour_types as Record<string, unknown>)?.label as string
            if (tourTypeLabel) {
                if (!difficulties[tourTypeLabel]) {
                    difficulties[tourTypeLabel] = []
                }
                difficulties[tourTypeLabel].push(diff.name as string)
            }
        }

        // Build icon map from tour types
        const tourTypeIcons: { [tourType: string]: string } = {}
        for (const t of (typesRes.data || [])) {
            if (t.icon) {
                tourTypeIcons[t.label as string] = t.icon as string
            }
        }

        return { tourTypes, tourLengths, difficulties, tourTypeIcons }
    }

    async updateSettings(_updates: Partial<TourSettings>): Promise<TourSettings> {
        return this.getSettings()
    }

    async addTourType(type: string): Promise<boolean> {
        const name = type.toLowerCase().replace(/\s+/g, '-')
        const { error } = await this.supabase
            .from('tour_types')
            .insert({ name, label: type })
        return !error
    }

    async removeTourType(type: string): Promise<boolean> {
        // First get the tour type ID
        const tourTypeId = await this.getTourTypeIdByLabel(type)
        if (!tourTypeId) return false

        // Check if any tours use this type
        const { count, error: countError } = await this.supabase
            .from('tours')
            .select('*', { count: 'exact', head: true })
            .eq('tour_type_id', tourTypeId)

        if (countError) return false
        if (count && count > 0) {
            console.error(`Cannot delete tour type "${type}": ${count} tours are using it`)
            return false
        }

        // Delete associated difficulties first
        await this.supabase
            .from('tour_difficulties')
            .delete()
            .eq('tour_type_id', tourTypeId)

        // Now delete the tour type
        const { error } = await this.supabase
            .from('tour_types')
            .delete()
            .eq('id', tourTypeId)
        return !error
    }

    async renameTourType(oldName: string, newName: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_types')
            .update({ name: newName.toLowerCase().replace(/\s+/g, '-'), label: newName })
            .eq('label', oldName)
        return !error
    }

    async updateTourTypeIcon(tourType: string, iconName: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_types')
            .update({ icon: iconName })
            .eq('label', tourType)
        return !error
    }

    async addTourLength(length: string): Promise<boolean> {
        const name = length.toLowerCase().replace(/\s+/g, '-')
        const { error } = await this.supabase
            .from('tour_lengths')
            .insert({ name, label: length })
        return !error
    }

    async removeTourLength(length: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_lengths')
            .delete()
            .eq('label', length)
        return !error
    }

    async renameTourLength(oldName: string, newName: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_lengths')
            .update({ name: newName.toLowerCase().replace(/\s+/g, '-'), label: newName })
            .eq('label', oldName)
        return !error
    }

    async updateTourTypesOrder(orderedTypes: string[]): Promise<void> {
        await Promise.all(
            orderedTypes.map((label, index) =>
                this.supabase
                    .from('tour_types')
                    .update({ sort_order: index })
                    .eq('label', label)
            )
        )
    }

    async updateTourLengthsOrder(orderedLengths: string[]): Promise<void> {
        await Promise.all(
            orderedLengths.map((label, index) =>
                this.supabase
                    .from('tour_lengths')
                    .update({ sort_order: index })
                    .eq('label', label)
            )
        )
    }

    // ====== DIFFICULTIES ======

    private async getTourTypeIdByLabel(label: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('tour_types')
            .select('id')
            .eq('label', label)
            .single()
        if (error || !data) return null
        return data.id as string
    }

    private async getTourLengthIdByLabel(label: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('tour_lengths')
            .select('id')
            .eq('label', label)
            .single()
        if (error || !data) return null
        return data.id as string
    }

    private async getDifficultyIdByName(tourTypeId: string, difficultyName: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('tour_difficulties')
            .select('id')
            .eq('tour_type_id', tourTypeId)
            .eq('name', difficultyName)
            .single()
        if (error || !data) return null
        return data.id as string
    }

    async addDifficulty(tourType: string, difficulty: string): Promise<boolean> {
        const tourTypeId = await this.getTourTypeIdByLabel(tourType)
        if (!tourTypeId) return false

        const { error } = await this.supabase
            .from('tour_difficulties')
            .insert({ tour_type_id: tourTypeId, name: difficulty })
        return !error
    }

    async removeDifficulty(tourType: string, difficulty: string): Promise<boolean> {
        const tourTypeId = await this.getTourTypeIdByLabel(tourType)
        if (!tourTypeId) return false

        const { error } = await this.supabase
            .from('tour_difficulties')
            .delete()
            .eq('tour_type_id', tourTypeId)
            .eq('name', difficulty)
        return !error
    }

    async renameDifficulty(tourType: string, oldName: string, newName: string): Promise<boolean> {
        const tourTypeId = await this.getTourTypeIdByLabel(tourType)
        if (!tourTypeId) return false

        const { error } = await this.supabase
            .from('tour_difficulties')
            .update({ name: newName })
            .eq('tour_type_id', tourTypeId)
            .eq('name', oldName)
        return !error
    }

    async updateDifficultiesOrder(tourType: string, orderedDifficulties: string[]): Promise<void> {
        const tourTypeId = await this.getTourTypeIdByLabel(tourType)
        if (!tourTypeId) return

        await Promise.all(
            orderedDifficulties.map((name, index) =>
                this.supabase
                    .from('tour_difficulties')
                    .update({ sort_order: index })
                    .eq('tour_type_id', tourTypeId)
                    .eq('name', name)
            )
        )
    }

    async getDifficultiesForTourType(tourType: string): Promise<string[]> {
        const tourTypeId = await this.getTourTypeIdByLabel(tourType)
        if (!tourTypeId) return []

        const { data, error } = await this.supabase
            .from('tour_difficulties')
            .select('name')
            .eq('tour_type_id', tourTypeId)
            .order('sort_order')

        if (error || !data) return []
        return data.map((d: Record<string, unknown>) => d.name as string)
    }

    // ====== FILE UPLOAD ======

    async uploadGpxFile(tourId: string, file: File): Promise<string> {
        const fileName = `${tourId}/${Date.now()}-${file.name}`
        const { data, error } = await this.supabase.storage
            .from('gpx-files')
            .upload(fileName, file)

        if (error) throw new Error(error.message)

        const { data: urlData } = this.supabase.storage
            .from('gpx-files')
            .getPublicUrl(data.path)

        return urlData.publicUrl
    }

    async deleteGpxFile(gpxUrl: string): Promise<void> {
        // Extract path from URL
        const path = gpxUrl.split('/gpx-files/')[1]
        if (path) {
            await this.supabase.storage.from('gpx-files').remove([path])
        }
    }

    async uploadProfilePhoto(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${userId}/${Date.now()}.${ext}`
        const { data, error } = await this.supabase.storage
            .from('profile-photos')
            .upload(fileName, file, { upsert: true })

        if (error) throw new Error(error.message)

        const { data: urlData } = this.supabase.storage
            .from('profile-photos')
            .getPublicUrl(data.path)

        return urlData.publicUrl
    }

    async deleteProfilePhoto(photoUrl: string): Promise<void> {
        const path = photoUrl.split('/profile-photos/')[1]
        if (path) {
            await this.supabase.storage.from('profile-photos').remove([path])
        }
    }

    // ====== HELPER METHODS ======

    private async mapDbTourToTour(db: Record<string, unknown>): Promise<Tour> {
        const participants = (db.tour_participants as Array<{ user_id: string; is_waitlist: boolean }>) || []
        const participantIds = participants.filter(p => !p.is_waitlist).map(p => p.user_id)
        const waitlistIds = participants.filter(p => p.is_waitlist).map(p => p.user_id)

        // Fetch participant users
        let participantUsers: User[] = []
        let waitlistUsers: User[] = []

        if (participantIds.length > 0) {
            const { data } = await this.supabase
                .from('users')
                .select('*')
                .in('id', participantIds)
            participantUsers = (data || []).map(u => this.mapDbUserToUser(u))
        }

        if (waitlistIds.length > 0) {
            const { data } = await this.supabase
                .from('users')
                .select('*')
                .in('id', waitlistIds)
            waitlistUsers = (data || []).map(u => this.mapDbUserToUser(u))
        }

        let leader: User | undefined = undefined
        if (db.leader) {
            leader = this.mapDbUserToUser(db.leader as Record<string, unknown>)
        }

        return {
            id: db.id as string,
            title: db.title as string,
            description: db.description as string | undefined,
            date: db.date as string,
            time: db.time as string | undefined,
            type: (db.tour_type as Record<string, unknown>)?.label as string || '',
            difficulty: (db.tour_difficulty as Record<string, unknown>)?.name as string | undefined,
            length: (db.tour_length as Record<string, unknown>)?.label as string | undefined,
            peak: db.peak as string | undefined,
            peakElevation: db.peak_elevation as number | undefined,
            ascent: db.ascent as number | undefined,
            descent: db.descent as number | undefined,
            durationMin: db.duration_min as number | undefined,
            durationMax: db.duration_max as number | undefined,
            maxParticipants: db.max_participants as number | undefined,
            meetingPoint: db.meeting_point as string | undefined,
            meetingPointLink: db.meeting_point_link as string | undefined,
            gpxFile: db.gpx_url as string | undefined,
            whatsappLink: db.whatsapp_link as string | undefined,
            status: db.status as 'draft' | 'published' | 'cancelled' | 'completed',
            leaderId: db.leader_id as string,
            leader: leader,
            participants: participantUsers,
            waitlist: waitlistUsers,
            createdAt: db.created_at as string,
            updatedAt: db.updated_at as string,
        }
    }

    // ===== NOTIFICATIONS =====

    async getNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching notifications:', error)
            return []
        }
        return data.map(n => this.mapDbNotificationToNotification(n))
    }

    async getUnreadNotificationCount(userId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false)

        if (error) return 0
        return count || 0
    }

    async createNotification(notification: {
        userId: string
        type: string
        title: string
        message: string
        link?: string
    }): Promise<Notification | null> {
        const { data, error } = await this.supabase
            .from('notifications')
            .insert({
                user_id: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return null
        }
        return this.mapDbNotificationToNotification(data)
    }

    async createNotificationForAllUsers(notification: {
        type: string
        title: string
        message: string
        link?: string
    }, excludeUserId?: string): Promise<void> {
        const users = await this.getUsers()
        const notifications = users
            .filter(u => u.id !== excludeUserId)
            .map(u => ({
                user_id: u.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
            }))

        if (notifications.length > 0) {
            const { error } = await this.supabase
                .from('notifications')
                .insert(notifications)

            if (error) {
                console.error('Error creating notifications for all users:', error)
            }
        }
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        if (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    async markAllNotificationsAsRead(userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false)

        if (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    private mapDbNotificationToNotification(db: Record<string, unknown>): Notification {
        return {
            id: db.id as string,
            userId: db.user_id as string,
            type: (db.type as string || 'TOUR_UPDATE') as NotificationType,
            title: db.title as string,
            message: db.message as string || '',
            link: db.link as string | undefined,
            read: db.read as boolean,
            createdAt: db.created_at as string,
        }
    }
}

export const supabaseRepository = new SupabaseRepository()

