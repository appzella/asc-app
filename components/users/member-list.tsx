'use client'

import { useState } from "react"
import { User } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Phone } from "lucide-react"

interface MemberListProps {
    users: User[]
}

function MemberCard({ user }: { user: User }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user.profilePhoto || ""} alt={user.name} />
                <AvatarFallback className="text-lg">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{user.name}</span>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'leader' ? 'secondary' : 'outline'} className="shrink-0">
                        {user.role === 'admin' ? 'Admin' : user.role === 'leader' ? 'Tourenleiter' : 'Mitglied'}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {user.email && (
                        <a href={`mailto:${user.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <Mail className="h-3 w-3" />
                            <span className="truncate hidden sm:inline">{user.email}</span>
                        </a>
                    )}
                    {user.mobile && (
                        <a href={`tel:${user.mobile}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <Phone className="h-3 w-3" />
                            <span className="hidden sm:inline">{user.mobile}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

export function MemberList({ users }: MemberListProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase()
        return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    })

    // Group by role
    const admins = filteredUsers.filter(u => u.role === 'admin')
    const leaders = filteredUsers.filter(u => u.role === 'leader')
    const members = filteredUsers.filter(u => u.role === 'member')

    return (
        <div className="space-y-6">
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

            {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                    {searchQuery ? "Keine Mitglieder gefunden" : "Keine Mitglieder vorhanden"}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Admins & Leaders */}
                    {(admins.length > 0 || leaders.length > 0) && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Vorstand & Tourenleiter</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[...admins, ...leaders].map(user => <MemberCard key={user.id} user={user} />)}
                            </div>
                        </div>
                    )}

                    {/* Members */}
                    {members.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mitglieder</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {members.map(user => <MemberCard key={user.id} user={user} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Result count */}
            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} von {users.length} Mitglied{users.length !== 1 ? 'ern' : ''}
                </p>
            )}
        </div>
    )
}
