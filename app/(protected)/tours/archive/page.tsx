import { getServerRepository } from "@/lib/data/server"
import { TourGrid } from "@/components/tours/tour-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/duration"
import { Calendar, Users, Mountain, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function ToursArchivePage() {
    const repository = await getServerRepository()
    const rawTours = await repository.getTours()

    // Filter for past tours and sort descending
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const pastTours = rawTours
        .filter(t => new Date(t.date) < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate stats
    const totalPastTours = pastTours.length
    const totalParticipations = pastTours.reduce((sum, t) => sum + t.participants.length, 0)
    const uniqueYears = [...new Set(pastTours.map(t => new Date(t.date).getFullYear()))].length

    const tours: any[] = pastTours.map(t => ({
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
        duration: t.duration,
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
                    <h1 className="text-2xl font-bold tracking-tight">Archiv</h1>
                    <p className="text-muted-foreground">Vergangene Touren und Events.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 px-4 lg:px-6 grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Touren</CardTitle>
                        <Mountain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPastTours}</div>
                        <p className="text-xs text-muted-foreground">durchgeführt</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teilnahmen</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalParticipations}</div>
                        <p className="text-xs text-muted-foreground">gesamt</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jahre</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueYears}</div>
                        <p className="text-xs text-muted-foreground">im Archiv</p>
                    </CardContent>
                </Card>
            </div>

            <div className="px-4 lg:px-6 flex flex-col gap-4">
                <TourGrid initialTours={tours} />
            </div>
        </div>
    )
}
