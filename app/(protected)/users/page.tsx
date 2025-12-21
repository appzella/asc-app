import { getDataRepository } from "@/lib/data"
import { UserList } from "@/components/users/user-list"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Mitglieder",
    description: "Liste aller Vereinsmitglieder",
}

export default async function UsersPage() {
    const repository = getDataRepository()
    const users = await repository.getUsers()

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Mitglieder</h1>
            </div>
            <div className="px-4 lg:px-6">
                <UserList users={users} />
            </div>
        </div>
    )
}
