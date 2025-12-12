import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { dataRepository } from "@/lib/data"
import { ProfileForm } from "@/components/profile/profile-form"
import { Separator } from "@/components/ui/separator"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect("/login")
    }

    const user = await dataRepository.getUserById(authUser.id)

    if (!user) {
        // Should theoretically not happen if logged in, but handle gracefully
        return <div>Benutzerprofil nicht gefunden.</div>
    }

    return (
        <div className="flex flex-1 flex-col max-w-4xl mx-auto w-full">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex flex-col gap-2 px-4 lg:px-6">
                    <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
                    <p className="text-muted-foreground">
                        Verwalte deine persönlichen Informationen und Einstellungen.
                    </p>
                </div>
                <div className="px-4 lg:px-6">
                    <ProfileForm user={user} />
                </div>
            </div>
        </div>
    )
}
