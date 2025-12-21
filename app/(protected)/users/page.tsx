import { getDataRepository } from "@/lib/data"
import { MemberList } from "@/components/users/member-list"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Mitglieder",
    description: "Liste aller Vereinsmitglieder",
}

export default async function UsersPage() {
    const repository = getDataRepository()
    const users = await repository.getUsers()

    // Filter only active users for the public member list
    const activeUsers = users.filter(u => u.active)

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Mitglieder</h1>
                    <p className="text-muted-foreground">{activeUsers.length} aktive Vereinsmitglieder</p>
                </div>
            </div>
            <div className="px-4 lg:px-6">
                <MemberList users={activeUsers} />
            </div>
        </div>
    )
}
