"use client"

import { useState } from "react"

import { FilterState, TourFilterBar } from "@/components/tours/tour-filter-bar"
import { TourGrid } from "@/components/tours/tour-grid"

export default function ToursPage() {
    const [filters, setFilters] = useState<FilterState>({
        type: "",
        difficulty: "",
        search: "",
        myTours: false,
    })

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex flex-col gap-4">
                <TourFilterBar onFilterChange={setFilters} />
                <TourGrid filters={filters} />
            </div>
        </div>
    )
}
