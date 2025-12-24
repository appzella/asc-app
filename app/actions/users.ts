'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/lib/types"

async function isAdmin(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return false

    const repository = await getServerRepository()
    const users = await repository.getUsers()
    const currentUser = users.find(u => u.id === authUser.id)
    return currentUser?.role === 'admin'
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    if (!await isAdmin()) {
        return { success: false, error: 'Keine Berechtigung' }
    }

    try {
        const repository = await getServerRepository()
        const result = await repository.updateUser(userId, { role: newRole })
        if (!result) {
            return { success: false, error: 'Fehler beim Aktualisieren der Rolle' }
        }
        return { success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        // Check for last admin constraint
        if (message.includes('mindestens ein Administrator')) {
            return { success: false, error: 'Es muss mindestens ein Administrator existieren.' }
        }
        return { success: false, error: message }
    }
}

export async function toggleUserStatus(userId: string, newStatus: boolean): Promise<{ success: boolean; error?: string }> {
    if (!await isAdmin()) {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const repository = await getServerRepository()
    const result = await repository.updateUser(userId, { isActive: newStatus })
    if (!result) {
        return { success: false, error: 'Fehler beim Aktualisieren des Status' }
    }
    return { success: true }
}

