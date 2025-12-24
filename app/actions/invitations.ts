'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function isAdmin(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return false

    const repository = await getServerRepository()
    const users = await repository.getUsers()
    const currentUser = users.find(u => u.id === authUser.id)
    return currentUser?.role === 'admin'
}

export async function createInvitation(email: string): Promise<{ success: boolean; error?: string }> {
    if (!await isAdmin()) {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const repository = await getServerRepository()
    await repository.createInvitation(email, 'Admin')
    revalidatePath('/admin/invitations')
    return { success: true }
}

