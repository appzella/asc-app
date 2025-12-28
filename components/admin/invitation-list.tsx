'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Invitation } from "@/lib/types"
import { Search, Mail, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface InvitationListProps {
    invitations: Invitation[]
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
    const [copied, setCopied] = useState(false)

    const copyLink = () => {
        const link = `${window.location.origin}/register/${invitation.token}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast.success("Link kopiert!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium">{invitation.email}</span>
                    <span className="text-sm text-muted-foreground">
                        {new Date(invitation.createdAt).toLocaleDateString('de-CH')}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Badge variant={invitation.used ? "secondary" : "default"} className={invitation.used ? "" : "bg-green-600 hover:bg-green-700"}>
                    {invitation.used ? "Benutzt" : "Offen"}
                </Badge>

                {!invitation.used && (
                    <Button variant="outline" size="sm" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                )}
            </div>
        </div>
    )
}

export function InvitationList({ invitations }: InvitationListProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredInvitations = invitations.filter(inv =>
        inv.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Suche nach Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Invitation list */}
            <div className="rounded-md border bg-card">
                {filteredInvitations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {searchQuery ? "Keine Einladungen gefunden" : "Noch keine Einladungen erstellt"}
                    </div>
                ) : (
                    filteredInvitations.map(inv => <InvitationRow key={inv.token} invitation={inv} />)
                )}
            </div>

            {/* Result count */}
            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    {filteredInvitations.length} von {invitations.length} Einladung{invitations.length !== 1 ? 'en' : ''}
                </p>
            )}
        </div>
    )
}
