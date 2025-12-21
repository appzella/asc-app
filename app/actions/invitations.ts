'use server'

import { getDataRepository } from "@/lib/data"
import { revalidatePath } from "next/cache"

export async function createInvitation(email: string) {
    const repository = getDataRepository()
    await repository.createInvitation(email, 'Admin') // Hardcoded admin for now
    revalidatePath('/admin/invitations')
    return { success: true }
}
