'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UserSettings {
    theme?: 'light' | 'dark' | 'system'
    emailNotifications?: boolean
    pushNotifications?: boolean
}

export async function updateUserSettings(settings: UserSettings): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
            return { success: false, error: 'Nicht angemeldet' }
        }

        const repository = await getServerRepository()
        const result = await repository.updateUser(authUser.id, settings)

        if (!result) {
            return { success: false, error: 'Fehler beim Speichern' }
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating user settings:', error)
        return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
}

export async function getUserSettings(): Promise<UserSettings | null> {
    try {
        const supabase = await createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return null

        const repository = await getServerRepository()
        const users = await repository.getUsers()
        const currentUser = users.find(u => u.id === authUser.id)

        if (!currentUser) return null

        return {
            theme: currentUser.theme,
            emailNotifications: currentUser.emailNotifications,
            pushNotifications: currentUser.pushNotifications,
        }
    } catch (error) {
        console.error('Error getting user settings:', error)
        return null
    }
}
