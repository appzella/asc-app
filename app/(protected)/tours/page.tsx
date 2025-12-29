import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { TourGrid } from "@/components/tours/tour-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Plus } from "lucide-react"
import Link from "next/link"
import { canCreateTour } from "@/lib/roles"

export const dynamic = 'force-dynamic'

export default async function ToursPage() {
    // Parallel data fetching for better performance
    const [repository, supabase] = await Promise.all([
        getServerRepository(),
        createClient()
    ])

    const [rawTours, users, { data: { user: authUser } }] = await Promise.all([
        repository.getTours(),
        repository.getUsers(),
        supabase.auth.getUser()
    ])

    const currentUser = authUser ? users.find(u => u.id === authUser.id) : null
    const showCreateButton = currentUser ? canCreateTour(currentUser.role) : false

    // Filter for upcoming tours (today or later)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const upcomingTours = rawTours
        .filter(t => new Date(t.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Stats
    const totalUpcoming = upcomingTours.length
    const nextTour = upcomingTours[0]
    const nextTourDate = nextTour ? new Date(nextTour.date).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }) : '-'

    const tours: any[] = upcomingTours.map(t => ({
        id: t.id,
        title: t.title,
        date: new Date(t.date).toLocaleDateString('de-CH'),
        type: t.type,
        difficulty: t.difficulty,
        guide: t.leader?.name || 'Unbekannt',
        guidePhoto: t.leader?.profilePhoto,
        location: t.peak || 'Ostschweiz',
        ascent: t.ascent,
        descent: t.descent,
        durationMin: t.durationMin,
        durationMax: t.durationMax,
        description: t.description,
        participants: {
            current: t.participants.length,
            max: t.maxParticipants
        },
        status: t.status,
        peak: t.peak,
        peakElevation: t.peakElevation,
    }))

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Aktuelle Touren</h1>
                    <p className="text-muted-foreground">Entdecke unsere nächsten Abenteuer.</p>
                </div>
                {showCreateButton && (
                    <Button asChild>
                        <Link href="/tours/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tour erstellen
                        </Link>
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 px-4 lg:px-6 grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Geplante Touren</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUpcoming}</div>
                        <p className="text-xs text-muted-foreground">in Planung</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nächste Tour</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{nextTourDate}</div>
                        <p className="text-xs text-muted-foreground truncate">{nextTour?.title || 'Keine geplant'}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="px-4 lg:px-6 flex flex-col gap-4">
                <TourGrid initialTours={tours} />
            </div>
        </div>
    )
}
