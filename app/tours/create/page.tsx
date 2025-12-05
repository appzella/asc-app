import { TourForm } from "@/components/tours/tour-form"

export default function CreateTourPage() {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Neue Tour erstellen</h1>
                <p className="text-muted-foreground">
                    Erfasse eine neue Tour für den Club.
                </p>
            </div>
            <TourForm />
        </div>
    )
}
