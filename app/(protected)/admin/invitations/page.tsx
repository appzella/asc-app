import { getDataRepository } from "@/lib/data"
import { InvitationList } from "@/components/admin/invitation-list"
import { CreateInvitationDialog } from "@/components/admin/create-invitation-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MailCheck, Clock } from "lucide-react"

export default async function AdminInvitationsPage() {
    const repository = getDataRepository()
    const invitations = await repository.getInvitations()

    // Calculate stats
    const totalInvitations = invitations.length
    const usedInvitations = invitations.filter(i => i.used).length
    const pendingInvitations = invitations.filter(i => !i.used).length

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Einladungen</h1>
                    <p className="text-muted-foreground">Verwalte Einladungen für neue Mitglieder.</p>
                </div>
                <CreateInvitationDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 px-4 lg:px-6 grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInvitations}</div>
                        <p className="text-xs text-muted-foreground">Einladungen erstellt</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offen</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingInvitations}</div>
                        <p className="text-xs text-muted-foreground">ausstehend</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Benutzt</CardTitle>
                        <MailCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usedInvitations}</div>
                        <p className="text-xs text-muted-foreground">registriert</p>
                    </CardContent>
                </Card>
            </div>

            <div className="px-4 lg:px-6">
                <InvitationList invitations={invitations} />
            </div>
        </div>
    )
}
