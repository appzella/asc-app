import { notFound, redirect } from 'next/navigation'
import { getServerRepository } from '@/lib/data/server'
import { TourForm } from '@/components/tours/tour-form'
import { canEditTour } from '@/lib/roles'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

interface EditTourPageProps {
    params: Promise<{ id: string }>
}

export default async function EditTourPage({ params }: EditTourPageProps) {
    const { id: tourId } = await params

    // Get current user from Supabase auth
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    const repository = await getServerRepository()

    // Load tour and user data
    const [tour, currentUser] = await Promise.all([
        repository.getTourById(tourId),
        repository.getUserById(authUser.id)
    ])

    if (!tour) {
        notFound()
    }

    if (!currentUser) {
        redirect('/login')
    }

    // Check permissions
    if (!canEditTour(currentUser.role, tour.leaderId, currentUser.id, tour.status)) {
        redirect(`/tours/${tourId}`)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-4 px-4 lg:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/tours/${tourId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Tour bearbeiten</h1>
                    <p className="text-muted-foreground">
                        {tour.peak && tour.peakElevation
                            ? `${tour.peak} ${tour.peakElevation} m`
                            : tour.title
                        }
                    </p>
                </div>
            </div>
            <div className="px-4 lg:px-6 max-w-4xl">
                <TourForm mode="edit" initialData={tour} />
            </div>
        </div>
    )
}
