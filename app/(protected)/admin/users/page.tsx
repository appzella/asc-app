import { getDataRepository } from "@/lib/data"
import { AdminUserManager } from "@/components/admin/admin-user-manager"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
    const repository = getDataRepository()
    const users = await repository.getUsers()

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Benutzerverwaltung</h1>
                    <p className="text-muted-foreground">Verwalte Mitglieder und deren Rollen.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/invitations">
                        <Plus className="mr-2 h-4 w-4" />
                        Einladen
                    </Link>
                </Button>
            </div>

            {/* Client component handles stats and list with live updates */}
            <div className="px-4 lg:px-6">
                <AdminUserManager initialUsers={users} />
            </div>
        </div>
    )
}
