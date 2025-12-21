import { TourForm } from "@/components/tours/tour-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateTourPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-4 px-4 lg:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/tours">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Neue Tour erstellen</h1>
                    <p className="text-muted-foreground">Erfasse eine neue Tour für den Club.</p>
                </div>
            </div>
            <div className="px-4 lg:px-6 max-w-4xl">
                <TourForm />
            </div>
        </div>
    )
}
