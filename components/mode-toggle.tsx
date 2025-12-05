"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            <Switch
                id="theme-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle theme"
                thumbContent={
                    theme === "dark" ? (
                        <Moon className="h-3 w-3 text-foreground" />
                    ) : (
                        <Sun className="h-3 w-3 text-foreground" />
                    )
                }
            />
            <span className="sr-only">Toggle theme</span>
        </div>
    )
}
