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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <TourFilterBar onFilterChange={setFilters} />
            <TourGrid filters={filters} />
        </div>
    )
}
