"use client"

import { SearchIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export interface FilterState {
    type: string
    difficulty: string
    search: string
    myTours: boolean
}

interface TourFilterBarProps {
    onFilterChange: (filters: FilterState) => void
}

const TOUR_TYPES = ["Skitour", "Hochtour", "Wanderung", "Klettern", "Bike"]

const DIFFICULTIES: Record<string, string[]> = {
    Skitour: ["L", "WS", "ZS", "S", "SS", "AS", "EX"],
    Hochtour: ["L", "WS", "ZS", "S", "SS", "AS", "EX"],
    Wanderung: ["T1", "T2", "T3", "T4", "T5", "T6"],
    Klettern: ["1", "2", "3", "4", "5", "6", "7", "8"],
    Bike: ["S0", "S1", "S2", "S3", "S4", "S5"],
}

export function TourFilterBar({ onFilterChange }: TourFilterBarProps) {
    const [type, setType] = useState<string>("all")
    const [difficulty, setDifficulty] = useState<string>("all")
    const [search, setSearch] = useState("")
    const [myTours, setMyTours] = useState(false)

    // Reset difficulty when type changes
    useEffect(() => {
        if (type === "all") {
            setDifficulty("all")
        } else {
            setDifficulty("all")
        }
    }, [type])

    // Notify parent of changes
    useEffect(() => {
        onFilterChange({
            type: type === "all" ? "" : type,
            difficulty: difficulty === "all" ? "" : difficulty,
            search,
            myTours,
        })
    }, [type, difficulty, search, myTours, onFilterChange])

    const availableDifficulties =
        type !== "all" && DIFFICULTIES[type] ? DIFFICULTIES[type] : []

    return (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                <div className="w-full md:w-[200px]">
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Tourenart" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Arten</SelectItem>
                            {TOUR_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-[200px]">
                    <Select
                        value={difficulty}
                        onValueChange={setDifficulty}
                        disabled={type === "all"}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Schwierigkeit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Schwierigkeiten</SelectItem>
                            {availableDifficulties.map((d) => (
                                <SelectItem key={d} value={d}>
                                    {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Suche nach Touren..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="my-tours"
                    checked={myTours}
                    onCheckedChange={setMyTours}
                />
                <Label htmlFor="my-tours">Nur meine Touren</Label>
            </div>
        </div>
    )
}
