import { createClient } from '../supabase/client'
import { User, Tour, Invitation, TourSettings, TourType, TourLength } from '../types'
import { IDataRepository } from './repository'

/**
 * Supabase Data Repository Implementation
 */
export class SupabaseRepository implements IDataRepository {
    private supabase = createClient()

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
        if (updates.emergencyContact !== undefined) dbUpdates.emergency_contact = updates.emergencyContact
        if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
        dbUpdates.updated_at = new Date().toISOString()

        const { data, error } = await this.supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) return null
        return this.mapDbUserToUser(data)
    }

    private mapDbUserToUser(db: Record<string, unknown>): User {
        return {
            id: db.id as string,
            email: db.email as string,
            name: db.name as string || '',
            role: (db.role as 'admin' | 'leader' | 'member') || 'member',
            phone: db.phone as string | undefined,
            emergencyContact: db.emergency_contact as string | undefined,
            profilePhoto: db.profile_photo as string | undefined,
            isActive: db.is_active as boolean ?? true,
            createdAt: db.created_at as string,
        }
    }

    // ====== TOURS ======

    async getTours(): Promise<Tour[]> {
        const { data: tours, error } = await this.supabase
            .from('tours')
            .select('*, tour_participants(user_id, is_waitlist)')
            .order('date', { ascending: true })

        if (error) {
            console.error('Error fetching tours:', error)
            return []
        }

        return Promise.all(tours.map(t => this.mapDbTourToTour(t)))
    }

    async getTourById(id: string): Promise<Tour | null> {
        const { data, error } = await this.supabase
            .from('tours')
            .select('*, tour_participants(user_id, is_waitlist)')
            .eq('id', id)
            .single()

        if (error) return null
        return this.mapDbTourToTour(data)
    }

    async getPublishedTours(): Promise<Tour[]> {
        const { data, error } = await this.supabase
            .from('tours')
            .select('*, tour_participants(user_id, is_waitlist)')
            .eq('status', 'published')
            .order('date', { ascending: true })

        if (error) return []
        return Promise.all(data.map(t => this.mapDbTourToTour(t)))
    }

    async getDraftTours(): Promise<Tour[]> {
        const { data, error } = await this.supabase
            .from('tours')
            .select('*, tour_participants(user_id, is_waitlist)')
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
        const { data, error } = await this.supabase
            .from('tours')
            .insert({
                title: tour.title,
                description: tour.description,
                date: tour.date,
                time: tour.time,
                type: tour.type,
                difficulty: tour.difficulty,
                length: tour.length,
                peak: tour.peak,
                peak_elevation: tour.peakElevation,
                ascent: tour.ascent,
                descent: tour.descent,
                duration: tour.duration,
                max_participants: tour.maxParticipants,
                meeting_point: tour.meetingPoint,
                meeting_point_link: tour.meetingPointLink,
                gpx_url: tour.gpxFile,
                whatsapp_link: tour.whatsappLink,
                leader_id: tour.leaderId,
                status: 'published',
            })
            .select()
            .single()

        if (error) throw new Error(error.message)
        return this.mapDbTourToTour(data)
    }

    async updateTour(id: string, updates: Partial<Tour>, _submitForApproval?: boolean): Promise<Tour | null> {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.description !== undefined) dbUpdates.description = updates.description
        if (updates.date !== undefined) dbUpdates.date = updates.date
        if (updates.time !== undefined) dbUpdates.time = updates.time
        if (updates.type !== undefined) dbUpdates.type = updates.type
        if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty
        if (updates.length !== undefined) dbUpdates.length = updates.length
        if (updates.peak !== undefined) dbUpdates.peak = updates.peak
        if (updates.peakElevation !== undefined) dbUpdates.peak_elevation = updates.peakElevation
        if (updates.ascent !== undefined) dbUpdates.ascent = updates.ascent
        if (updates.descent !== undefined) dbUpdates.descent = updates.descent
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration
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
            .select()
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

    async submitTourForPublishing(id: string): Promise<Tour | null> {
        return this.publishTour(id) // Direct publish for now
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
        const [typesRes, lengthsRes] = await Promise.all([
            this.supabase.from('tour_types').select('*').order('sort_order'),
            this.supabase.from('tour_lengths').select('*').order('sort_order'),
        ])

        // Return as string arrays for backward compatibility with admin pages
        const tourTypes: string[] = (typesRes.data || []).map((t: Record<string, unknown>) => t.label as string)
        const tourLengths: string[] = (lengthsRes.data || []).map((l: Record<string, unknown>) => l.label as string)

        return { tourTypes, tourLengths }
    }

    async updateSettings(_updates: Partial<TourSettings>): Promise<TourSettings> {
        return this.getSettings()
    }

    async addTourType(type: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_types')
            .insert({ name: type, label: type })
        return !error
    }

    async removeTourType(type: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_types')
            .delete()
            .eq('name', type)
        return !error
    }

    async renameTourType(oldName: string, newName: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_types')
            .update({ name: newName, label: newName })
            .eq('name', oldName)
        return !error
    }

    async updateTourTypeIcon(tourType: string, iconName: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_types')
            .update({ icon: iconName })
            .eq('name', tourType)
        return !error
    }

    async addTourLength(length: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_lengths')
            .insert({ name: length, label: length })
        return !error
    }

    async removeTourLength(length: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_lengths')
            .delete()
            .eq('name', length)
        return !error
    }

    async renameTourLength(oldName: string, newName: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tour_lengths')
            .update({ name: newName, label: newName })
            .eq('name', oldName)
        return !error
    }

    async updateTourTypesOrder(orderedTypes: string[]): Promise<void> {
        await Promise.all(
            orderedTypes.map((name, index) =>
                this.supabase
                    .from('tour_types')
                    .update({ sort_order: index })
                    .eq('name', name)
            )
        )
    }

    async updateTourLengthsOrder(orderedLengths: string[]): Promise<void> {
        await Promise.all(
            orderedLengths.map((name, index) =>
                this.supabase
                    .from('tour_lengths')
                    .update({ sort_order: index })
                    .eq('name', name)
            )
        )
    }

    // Difficulties - simplified for now
    async addDifficulty(_tourType: string, _difficulty: string): Promise<boolean> {
        return true // Would need separate table
    }

    async removeDifficulty(_tourType: string, _difficulty: string): Promise<boolean> {
        return true
    }

    async renameDifficulty(_tourType: string, _oldName: string, _newName: string): Promise<boolean> {
        return true
    }

    async updateDifficultiesOrder(_tourType: string, _orderedDifficulties: string[]): Promise<void> {
        // Would need separate table
    }

    async getDifficultiesForTourType(_tourType: string): Promise<string[]> {
        // Default difficulties for now
        return ['L', 'WS', 'ZS', 'S']
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

        return {
            id: db.id as string,
            title: db.title as string,
            description: db.description as string | undefined,
            date: db.date as string,
            time: db.time as string | undefined,
            type: db.type as string,
            difficulty: db.difficulty as string | undefined,
            length: db.length as string | undefined,
            peak: db.peak as string | undefined,
            peakElevation: db.peak_elevation as number | undefined,
            ascent: db.ascent as number | undefined,
            descent: db.descent as number | undefined,
            duration: db.duration as string | undefined,
            maxParticipants: db.max_participants as number | undefined,
            meetingPoint: db.meeting_point as string | undefined,
            meetingPointLink: db.meeting_point_link as string | undefined,
            gpxFile: db.gpx_url as string | undefined,
            whatsappLink: db.whatsapp_link as string | undefined,
            status: db.status as 'draft' | 'published' | 'cancelled' | 'completed',
            leaderId: db.leader_id as string,
            participants: participantUsers,
            waitlist: waitlistUsers,
            createdAt: db.created_at as string,
            updatedAt: db.updated_at as string,
        }
    }
}

export const supabaseRepository = new SupabaseRepository()
