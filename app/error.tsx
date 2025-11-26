'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Etwas ist schiefgelaufen!</h2>
            <p className="text-muted-foreground">
                Ein unerwarteter Fehler ist aufgetreten.
            </p>
            <div className="mt-4 flex gap-2">
                <Button onClick={() => reset()} variant="default">
                    Erneut versuchen
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="outline">
                    Zur Startseite
                </Button>
            </div>
        </div>
    )
}
