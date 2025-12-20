import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Seite nicht gefunden</h2>
            <p className="text-muted-foreground">
                Die gesuchte Seite existiert leider nicht oder wurde verschoben.
            </p>
            <Button asChild className="mt-4">
                <Link href="/">Zurück zur Übersicht</Link>
            </Button>
        </div>
    )
}
