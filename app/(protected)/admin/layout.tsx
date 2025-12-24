import { redirect } from "next/navigation"
import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Get current user from Supabase auth
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect("/login")
    }

    // Get user profile with role from database
    const repository = await getServerRepository()
    const users = await repository.getUsers()
    const currentUser = users.find(u => u.id === authUser.id)

    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
        redirect("/")
    }

    return <>{children}</>
}
