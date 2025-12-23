'use client'

import { useState } from "react"
import { User, UserRole } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { updateUserRole, toggleUserStatus } from "@/app/actions/users"
import { Search } from "lucide-react"

interface AdminUserListProps {
    users: User[]
}

function UserRow({ user }: { user: User }) {
    const [currentRole, setCurrentRole] = useState<UserRole>(user.role)
    const [isActive, setIsActive] = useState(user.isActive || false)

    const handleRoleChange = async (newRole: UserRole) => {
        const previousRole = currentRole
        setCurrentRole(newRole)
        try {
            await updateUserRole(user.id, newRole)
            toast.success(`Rolle geändert`)
        } catch {
            setCurrentRole(previousRole)
            toast.error("Fehler beim Ändern der Rolle")
        }
    }

    const handleStatusToggle = async (checked: boolean) => {
        const previousStatus = isActive
        setIsActive(checked)
        try {
            await toggleUserStatus(user.id, checked)
            toast.success(checked ? "Aktiviert" : "Deaktiviert")
        } catch {
            setIsActive(previousStatus)
            toast.error("Fehler beim Ändern des Status")
        }
    }

    return (
        <div className="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
            {/* Flex wrap layout - automatically wraps on small screens */}
            <div className="flex flex-wrap items-center gap-3">
                {/* User info section - takes available space */}
                <div className="flex items-center gap-3 min-w-0 flex-1 basis-[200px]">
                    <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profilePhoto || ""} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {/* Status indicator dot */}
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{user.name}</span>
                        <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                    </div>
                </div>

                {/* Controls section - wraps to next line if no space */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Role selector - compact */}
                    <Select value={currentRole} onValueChange={(val) => handleRoleChange(val as UserRole)}>
                        <SelectTrigger className="w-[90px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="leader">TL</SelectItem>
                            <SelectItem value="member">Mitglied</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Active toggle */}
                    <Switch checked={isActive} onCheckedChange={handleStatusToggle} />
                </div>
            </div>
        </div>
    )
}

export function AdminUserList({ users }: AdminUserListProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase()
        return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    })

    return (
        <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Suche nach Name oder Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* User list */}
            <div className="rounded-md border bg-card">
                {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {searchQuery ? "Keine Benutzer gefunden" : "Keine Benutzer vorhanden"}
                    </div>
                ) : (
                    filteredUsers.map(user => <UserRow key={user.id} user={user} />)
                )}
            </div>

            {/* Result count */}
            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} von {users.length} Benutzer{users.length !== 1 ? 'n' : ''}
                </p>
            )}
        </div>
    )
}
