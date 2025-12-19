import { getDataRepository } from "@/lib/data"
import { TourGrid } from "@/components/tours/tour-grid"

export default async function ToursPage() {
    const repository = getDataRepository()
    const rawTours = await repository.getTours()

    const tours: any[] = rawTours.map(t => ({
        id: t.id,
        title: t.title,
        date: new Date(t.date).toLocaleDateString('de-CH'),
        type: t.tourType,
        difficulty: t.difficulty,
        guide: t.leader?.name || 'Unbekannt', // Use leader name or default
        location: t.peak || 'Ostschweiz', // Use peak or default region
        ascent: t.elevation,
        descent: t.elevation, // APPROXIMATION for now
        duration: `${t.duration}h`,
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
            <div className="px-4 lg:px-6 flex flex-col gap-4">
                <TourGrid initialTours={tours} />
            </div>
        </div>
    )
}
