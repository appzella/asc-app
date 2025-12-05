"use client"

import { FilterState } from "./tour-filter-bar"
import { Tour, TourCard } from "./tour-card"

interface TourGridProps {
    filters: FilterState
}

// Mock Data
const MOCK_TOURS: Tour[] = [
    {
        id: "1",
        title: "Skitour Piz Palü",
        date: "12.03.2025",
        type: "Skitour",
        difficulty: "ZS",
        guide: "Pascal Staub",
        location: "Bernina, Graubünden",
        ascent: 1200,
        descent: 1200,
        duration: "5-6h",
        description: "Wunderschöne Skitour auf einen der bekanntesten Gipfel der Ostalpen. Wir starten bei der Diavolezza und steigen über den Persgletscher auf.",
        participants: { current: 3, max: 6 },
        status: "published",
    },
    {
        id: "2",
        title: "Wanderung Säntis",
        date: "15.06.2025",
        type: "Wanderung",
        difficulty: "T3",
        guide: "Max Muster",
        location: "Alpstein, Appenzell",
        ascent: 800,
        descent: 800,
        duration: "4h",
        description: "Gemütliche Wanderung im Alpstein mit spektakulärer Aussicht auf den Bodensee und die Alpen. Trittsicherheit erforderlich.",
        participants: { current: 5, max: 10 },
        status: "published",
    },
    {
        id: "3",
        title: "Hochtour Matterhorn",
        date: "20.07.2025",
        type: "Hochtour",
        difficulty: "ZS",
        guide: "Pascal Staub",
        location: "Zermatt, Wallis",
        ascent: 1400,
        descent: 1400,
        duration: "8-9h",
        description: "Anspruchsvolle Hochtour über den Hörnligrat. Nur für sehr erfahrene Alpinisten mit sehr guter Kondition.",
        participants: { current: 1, max: 2 },
        status: "published",
    },
    {
        id: "4",
        title: "Klettern Bockmattli",
        date: "05.08.2025",
        type: "Klettern",
        difficulty: "6a",
        guide: "Sarah Sporty",
        location: "Wägital, Schwyz",
        ascent: 400,
        descent: 400,
        duration: "6h",
        description: "Klettertour im besten Kalk der Voralpen. Wir klettern die 'Supertramp' Route. Vorstiegskenntnisse im 6. Grad obligatorisch.",
        participants: { current: 2, max: 4 },
        status: "draft",
    },
    {
        id: "5",
        title: "Bike Tour Chur",
        date: "10.05.2025",
        type: "Bike",
        difficulty: "S2",
        guide: "Max Muster",
        location: "Chur, Graubünden",
        ascent: 950,
        descent: 950,
        duration: "3.5h",
        description: "Flowige Trails rund um Chur. Wir nutzen die Bergbahnen für den Uphill und geniessen die Abfahrt.",
        participants: { current: 4, max: 8 },
        status: "cancelled",
    },
    {
        id: "6",
        title: "Skitour Tödi",
        date: "25.03.2025",
        type: "Skitour",
        difficulty: "WS",
        guide: "Pascal Staub",
        location: "Glarus",
        ascent: 1800,
        descent: 1800,
        duration: "7h",
        description: "Der Klassiker in den Glarner Alpen. Langer Aufstieg der mit einer grandiosen Aussicht belohnt wird.",
        participants: { current: 6, max: 6 },
        status: "published",
    },
]

export function TourGrid({ filters }: TourGridProps) {
    const filteredTours = MOCK_TOURS.filter((tour) => {
        // Filter by Type
        if (filters.type && filters.type !== "all" && tour.type !== filters.type) {
            return false
        }

        // Filter by Difficulty
        if (
            filters.difficulty &&
            filters.difficulty !== "all" &&
            tour.difficulty !== filters.difficulty
        ) {
            return false
        }

        // Filter by Search (Title or Location)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            const matchesTitle = tour.title.toLowerCase().includes(searchLower)
            const matchesLocation = tour.location.toLowerCase().includes(searchLower)
            if (!matchesTitle && !matchesLocation) {
                return false
            }
        }

        // Filter by My Tours (Mock User: Pascal Staub)
        if (filters.myTours && tour.guide !== "Pascal Staub") {
            return false
        }

        return true
    })

    if (filteredTours.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">Keine Touren gefunden.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
            ))}
        </div>
    )
}
