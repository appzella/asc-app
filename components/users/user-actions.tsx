'use client'

import { useState } from "react"
import { User, UserRole } from "@/lib/types"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateUserRole, toggleUserStatus } from "@/app/actions/users"
import { Loader2 } from "lucide-react"

interface UserActionsProps {
    user: User
}

export function UserActions({ user }: UserActionsProps) {
    const [loadingRole, setLoadingRole] = useState(false)
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [currentRole, setCurrentRole] = useState<UserRole>(user.role)
    const [isActive, setIsActive] = useState(user.isActive || false)

    const handleRoleChange = async (newRole: UserRole) => {
        const previousRole = currentRole
        setCurrentRole(newRole) // Optimistic update
        setLoadingRole(true)
        try {
            await updateUserRole(user.id, newRole)
            toast.success(`Rolle zu ${newRole === 'admin' ? 'Admin' : newRole === 'leader' ? 'Tourenleiter' : 'Mitglied'} geändert`)
        } catch (error) {
            setCurrentRole(previousRole) // Revert on error
            toast.error("Fehler beim Ändern der Rolle")
        } finally {
            setLoadingRole(false)
        }
    }

    const handleStatusToggle = async (checked: boolean) => {
        const previousStatus = isActive
        setIsActive(checked) // Optimistic update
        setLoadingStatus(true)
        try {
            await toggleUserStatus(user.id, checked)
            toast.success(checked ? "Benutzer aktiviert" : "Benutzer deaktiviert")
        } catch (error) {
            setIsActive(previousStatus) // Revert on error
            toast.error("Fehler beim Ändern des Status")
        } finally {
            setLoadingStatus(false)
        }
    }

    return (
        <div className="flex items-center gap-4">
            <Select
                value={currentRole}
                onValueChange={(val) => handleRoleChange(val as UserRole)}
                disabled={loadingRole}
            >
                <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="leader">Tourenleiter</SelectItem>
                    <SelectItem value="member">Mitglied</SelectItem>
                </SelectContent>
            </Select>

            <Switch
                checked={isActive}
                onCheckedChange={handleStatusToggle}
                disabled={loadingStatus}
            />
        </div>
    )
}
