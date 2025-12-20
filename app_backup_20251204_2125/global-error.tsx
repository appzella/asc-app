'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
        <html>
            <body>
                <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Kritischer Fehler</h2>
                    <p className="text-muted-foreground">
                        Die Anwendung konnte nicht geladen werden.
                    </p>
                    <Button onClick={() => reset()}>Erneut versuchen</Button>
                </div>
            </body>
        </html>
    )
}
