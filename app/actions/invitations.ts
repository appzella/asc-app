'use server'

import { getServerRepository } from "@/lib/data/server"
import { revalidatePath } from "next/cache"

export async function createInvitation(email: string) {
    const repository = await getServerRepository()
    await repository.createInvitation(email, 'Admin') // Hardcoded admin for now
    revalidatePath('/admin/invitations')
    return { success: true }
}
