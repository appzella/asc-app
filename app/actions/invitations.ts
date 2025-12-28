'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getAdminUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const repository = await getServerRepository()
    const users = await repository.getUsers()
    const currentUser = users.find(u => u.id === authUser.id)

    if (currentUser?.role !== 'admin') return null
    return currentUser.id
}

export async function createInvitation(email: string): Promise<{ success: boolean; error?: string }> {
    const adminId = await getAdminUserId()

    if (!adminId) {
        return { success: false, error: 'Keine Berechtigung' }
    }

    try {
        const repository = await getServerRepository()
        await repository.createInvitation(email, adminId)
        revalidatePath('/admin/invitations')
        return { success: true }
    } catch (error) {
        console.error('Error creating invitation:', error)
        return { success: false, error: 'Fehler beim Erstellen der Einladung' }
    }
}
