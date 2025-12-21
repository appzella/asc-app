import { Mountain } from "lucide-react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-sm space-y-6">
                {/* Branding */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Mountain className="h-8 w-8" />
                        <span className="text-2xl font-bold">ASC St. Gallen</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Alpiner Ski-Club</p>
                </div>

                {children}
            </div>
        </div>
    )
}
