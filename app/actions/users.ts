'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/lib/types"

async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    return authUser?.id || null
}

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
    const currentUserId = await getCurrentUserId()

    if (!await isAdmin()) {
        return { success: false, error: 'Keine Berechtigung' }
    }

    try {
        const repository = await getServerRepository()
        const users = await repository.getUsers()
        const targetUser = users.find(u => u.id === userId)

        // Check if trying to change an admin's role
        if (targetUser?.role === 'admin' && newRole !== 'admin') {
            // Count active admins
            const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive !== false)

            if (activeAdmins.length <= 1) {
                // Check if it's the user themselves
                if (userId === currentUserId) {
                    return { success: false, error: 'Du bist der letzte Administrator. Es muss mindestens ein Admin existieren, bevor du deine Rolle ändern kannst.' }
                }
                return { success: false, error: 'Dies ist der letzte Administrator. Es muss mindestens ein aktiver Admin existieren.' }
            }
        }

        const result = await repository.updateUser(userId, { role: newRole })
        if (!result) {
            return { success: false, error: 'Fehler beim Aktualisieren der Rolle' }
        }
        return { success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        // Check for last admin constraint (backup from DB trigger)
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

    // Prevent self-deactivation
    const currentUserId = await getCurrentUserId()
    if (currentUserId === userId && newStatus === false) {
        return { success: false, error: 'Du kannst dich nicht selbst deaktivieren.' }
    }

    // Check if this is the only active admin being deactivated
    if (newStatus === false) {
        const repository = await getServerRepository()
        const users = await repository.getUsers()
        const targetUser = users.find(u => u.id === userId)

        if (targetUser?.role === 'admin') {
            const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive !== false)
            if (activeAdmins.length <= 1) {
                return { success: false, error: 'Der letzte aktive Administrator kann nicht deaktiviert werden.' }
            }
        }
    }

    const repository = await getServerRepository()
    const result = await repository.updateUser(userId, { isActive: newStatus })
    if (!result) {
        return { success: false, error: 'Fehler beim Aktualisieren des Status' }
    }
    return { success: true }
}
