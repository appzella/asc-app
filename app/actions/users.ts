'use server'

import { getServerRepository } from "@/lib/data/server"
import { UserRole } from "@/lib/types"

export async function updateUserRole(userId: string, newRole: UserRole) {
    const repository = await getServerRepository()
    await repository.updateUser(userId, { role: newRole })
    return { success: true }
}

export async function toggleUserStatus(userId: string, newStatus: boolean) {
    const repository = await getServerRepository()
    await repository.updateUser(userId, { isActive: newStatus })
    return { success: true }
}
