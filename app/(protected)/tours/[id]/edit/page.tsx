'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour } from '@/lib/types'
import { TourForm } from '@/components/tours/tour-form'
import { canEditTour } from '@/lib/roles'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function EditTourPage() {
    const params = useParams()
    const router = useRouter()
    const tourId = params.id as string

    const [user, setUser] = useState<User | null>(null)
    const [tour, setTour] = useState<Tour | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = authService.getCurrentUser()
                if (!currentUser) {
                    router.push('/login')
                    return
                }
                setUser(currentUser)

                const tourData = await dataRepository.getTourById(tourId)
                if (!tourData) {
                    toast.error('Tour nicht gefunden')
                    router.push('/tours')
                    return
                }

                // Check permissions
                if (!canEditTour(currentUser.role, tourData.leaderId, currentUser.id, tourData.status)) {
                    toast.error('Keine Berechtigung zum Bearbeiten')
                    router.push(`/tours/${tourId}`)
                    return
                }

                setTour(tourData)
            } catch (error) {
                console.error('Error loading tour:', error)
                toast.error('Fehler beim Laden der Tour')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [tourId, router])

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center gap-4 px-4 lg:px-6">
                    <Skeleton className="h-10 w-10" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="px-4 lg:px-6 max-w-4xl space-y-6">
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[150px] w-full" />
                </div>
            </div>
        )
    }

    if (!tour || !user) {
        return null
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
