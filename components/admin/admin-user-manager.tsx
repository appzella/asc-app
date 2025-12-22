'use client'

import { useState, useMemo } from "react"
import { User, UserRole } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Search, Users, ShieldCheck, UserX, Crown, User as UserIcon } from "lucide-react"

interface AdminUserManagerProps {
    initialUsers: User[]
}

function UserRow({
    user,
    onRoleChange,
    onStatusChange
}: {
    user: User
    onRoleChange: (userId: string, newRole: UserRole) => void
    onStatusChange: (userId: string, newStatus: boolean) => void
}) {
    const [currentRole, setCurrentRole] = useState<UserRole>(user.role)
    const [isActive, setIsActive] = useState(user.active)

    const handleRoleChange = async (newRole: UserRole) => {
        const previousRole = currentRole
        setCurrentRole(newRole)
        onRoleChange(user.id, newRole)
        try {
            await updateUserRole(user.id, newRole)
            toast.success(`Rolle geändert`)
        } catch {
            setCurrentRole(previousRole)
            onRoleChange(user.id, previousRole)
            toast.error("Fehler beim Ändern der Rolle")
        }
    }

    const handleStatusToggle = async (checked: boolean) => {
        const previousStatus = isActive
        setIsActive(checked)
        onStatusChange(user.id, checked)
        try {
            await toggleUserStatus(user.id, checked)
            toast.success(checked ? "Aktiviert" : "Deaktiviert")
        } catch {
            setIsActive(previousStatus)
            onStatusChange(user.id, previousStatus)
            toast.error("Fehler beim Ändern des Status")
        }
    }

    return (
        <div className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
                {/* Avatar with status */}
                <div className="relative shrink-0">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profilePhoto || ""} alt={user.name} />
                        <AvatarFallback className="text-xs">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>

                {/* Name & Email - takes remaining space */}
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>

                {/* Role selector - compact */}
                <Select value={currentRole} onValueChange={(val) => handleRoleChange(val as UserRole)}>
                    <SelectTrigger className="w-[90px] h-7 text-xs shrink-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="leader">Tourenleiter</SelectItem>
                        <SelectItem value="member">Mitglied</SelectItem>
                    </SelectContent>
                </Select>

                {/* Toggle */}
                <Switch checked={isActive} onCheckedChange={handleStatusToggle} className="shrink-0" />
            </div>
        </div>
    )
}

export function AdminUserManager({ initialUsers }: AdminUserManagerProps) {
    const [users, setUsers] = useState(initialUsers)
    const [searchQuery, setSearchQuery] = useState("")

    // Live stats calculation
    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length,
        admins: users.filter(u => u.role === 'admin').length,
        leaders: users.filter(u => u.role === 'leader').length,
    }), [users])

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase()
        return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    })

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }

    const handleStatusChange = (userId: string, newStatus: boolean) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: newStatus } : u))
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards - Live updating */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">{stats.active} aktiv</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.admins}</div>
                        <p className="text-xs text-muted-foreground">Administratoren</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tourenleiter</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.leaders}</div>
                        <p className="text-xs text-muted-foreground">können Touren erstellen</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inaktiv</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inactive}</div>
                        <p className="text-xs text-muted-foreground">deaktiviert</p>
                    </CardContent>
                </Card>
            </div>

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
                    filteredUsers.map(user => (
                        <UserRow
                            key={user.id}
                            user={user}
                            onRoleChange={handleRoleChange}
                            onStatusChange={handleStatusChange}
                        />
                    ))
                )}
            </div>

            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} von {users.length} Benutzer{users.length !== 1 ? 'n' : ''}
                </p>
            )}
        </div>
    )
}
