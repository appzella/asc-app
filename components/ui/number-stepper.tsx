"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface NumberStepperProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: number
    onValueChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
}

export function NumberStepper({
    value,
    onValueChange,
    min = 0,
    max = 99999,
    step = 1,
    unit,
    className,
    ...props
}: NumberStepperProps) {
    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault()
        if (value < max) {
            onValueChange(Math.min(value + step, max))
        }
    }

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault()
        if (value > min) {
            onValueChange(Math.max(value - step, min))
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value)
        if (!isNaN(newValue)) {
            onValueChange(newValue)
        } else if (e.target.value === "") {
            // Handle empty input if needed, typically we might want to keep it as number or allow empty
            // For this component ensuring strictly number based on props
            onValueChange(min)
        }
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDecrement}
                disabled={value <= min}
                type="button"
            >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease</span>
            </Button>
            <div className="relative flex-1">
                <Input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    className={cn("text-center h-8", unit ? "pr-8" : "")}
                    {...props}
                />
                {unit && (
                    <span className="absolute right-3 top-2 text-xs text-muted-foreground pointer-events-none">
                        {unit}
                    </span>
                )}
            </div>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleIncrement}
                disabled={value >= max}
                type="button"
            >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase</span>
            </Button>
        </div>
    )
}
