'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { dataRepository } from "@/lib/data"
import { User } from "@/lib/types"
import { ProfileForm } from "@/components/profile/profile-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadProfile = async () => {
            const authUser = authService.getCurrentUser()

            if (!authUser) {
                router.push("/login")
                return
            }

            const userData = await dataRepository.getUserById(authUser.id)
            if (userData) {
                setUser(userData)
            }
            setIsLoading(false)
        }

        loadProfile()

        const unsubscribe = authService.subscribe(async (updatedUser) => {
            if (!updatedUser) {
                router.push("/login")
            } else {
                const userData = await dataRepository.getUserById(updatedUser.id)
                if (userData) setUser(userData)
            }
        })

        return () => unsubscribe()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex flex-col gap-1 px-4 lg:px-6">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="px-4 lg:px-6 max-w-3xl space-y-4">
                    <Skeleton className="h-[180px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[280px] w-full" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground">Benutzerprofil nicht gefunden.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
                <p className="text-muted-foreground">
                    Verwalte deine persönlichen Informationen.
                </p>
            </div>

            <div className="px-4 lg:px-6 max-w-3xl">
                <ProfileForm user={user} />
            </div>
        </div>
    )
}
