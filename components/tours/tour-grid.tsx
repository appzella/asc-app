"use client"

import { useState } from "react"
import { Tour, TourCard } from "./tour-card"
import { FilterState, TourFilterBar } from "./tour-filter-bar"

interface TourGridProps {
    initialTours: Tour[]
}

export function TourGrid({ initialTours }: TourGridProps) {
    const [filters, setFilters] = useState<FilterState>({
        type: "",
        difficulty: "",
        search: "",
        myTours: false,
    })

    const filteredTours = initialTours.filter((tour) => {
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
            const matchesPeak = tour.peak?.toLowerCase().includes(searchLower)

            if (!matchesTitle && !matchesLocation && !matchesPeak) {
                return false
            }
        }

        // Filter by My Tours
        // Note: filtered by guide name which is brittle, but sufficient for mock demo
        if (filters.myTours && tour.guide !== "Pascal Staub") { // TODO: Get current user name dynamically
            return false
        }

        return true
    })

    return (
        <>
            <TourFilterBar onFilterChange={setFilters} />

            {filteredTours.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Keine Touren gefunden.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTours.map((tour) => (
                        <TourCard key={tour.id} tour={tour} />
                    ))}
                </div>
            )}
        </>
    )
}
