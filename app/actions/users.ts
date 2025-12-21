'use server'

import { getDataRepository } from "@/lib/data"
import { UserRole } from "@/lib/types"

export async function updateUserRole(userId: string, newRole: UserRole) {
    const repository = getDataRepository()
    await repository.updateUser(userId, { role: newRole })
    return { success: true }
}

export async function toggleUserStatus(userId: string, newStatus: boolean) {
    const repository = getDataRepository()
    await repository.updateUser(userId, { active: newStatus })
    return { success: true }
}

