'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourSettings } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { canEditTour, canPublishTour, canSubmitForPublishing } from '@/lib/roles'
import { formatDifficulty } from '@/lib/difficulty'
import { formatDuration } from '@/lib/duration'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, ArrowUpRight, Users, ChartNoAxesColumnIncreasing, Map, Download } from 'lucide-react'
import dynamic from 'next/dynamic'
const TourMap = dynamic(() => import('@/components/tours/tour-map'), { ssr: false })
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { QRCode } from '@/components/ui/shadcn-io/qr-code'

export default function TourDetailPage() {
    const params = useParams()
    const router = useRouter()
    const tourId = params.id as string

    const [user, setUser] = useState<User | null>(null)
    const [tour, setTour] = useState<Tour | null>(null)
    const [isRegistered, setIsRegistered] = useState(false)
    const [isOnWaitlist, setIsOnWaitlist] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showMapOnMobile, setShowMapOnMobile] = useState(false)
    const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
    const [manuallyAdded, setManuallyAdded] = useState(0)

    useEffect(() => {
        const loadTour = async () => {
            try {
                // Always fetch the tour, regardless of user auth
                const tourData = await dataRepository.getTourById(tourId)

                if (!tourData) {
                    router.push('/tours')
                    return
                }

                setTour(tourData)

                // Now check user auth for registration status
                const currentUser = authService.getCurrentUser()
                setUser(currentUser)

                if (currentUser) {
                    setIsRegistered(tourData.participants.includes(currentUser.id))
                    setIsOnWaitlist(tourData.waitlist?.includes(currentUser.id) || false)
                }

                const max = tourData.maxParticipants
                const current = tourData.participants.length
                setManuallyAdded(Math.max(0, current - max))

            } catch (error) {
                console.error('Error loading tour:', error)
                router.push('/tours')
            }

            setIsLoading(false)
        }

        loadTour()

        const unsubscribe = authService.subscribe((updatedUser) => {
            setUser(updatedUser)
        })

        return () => {
            unsubscribe()
        }
    }, [tourId, router])

    const handleRegister = async () => {
        if (!user || !tour) return

        try {
            const success = await dataRepository.registerForTour(tourId, user.id)
            if (success) {
                const updatedTour = await dataRepository.getTourById(tourId)
                if (updatedTour) {
                    setTour(updatedTour)
                    setIsRegistered(updatedTour.participants.includes(user.id))
                    setIsOnWaitlist(updatedTour.waitlist?.includes(user.id) || false)
                    if (updatedTour.whatsappGroupLink) {
                        setShowWhatsAppDialog(true)
                    }
                    toast.success('Erfolgreich angemeldet')
                }
            } else {
                toast.error('Anmeldung fehlgeschlagen')
            }
        } catch (error) {
            console.error('Error registering for tour:', error)
        }
    }

    const handleUnregister = async () => {
        if (!user || !tour) return

        try {
            const success = await dataRepository.unregisterFromTour(tourId, user.id)
            if (success) {
                const updatedTour = await dataRepository.getTourById(tourId)
                if (updatedTour) {
                    setTour(updatedTour)
                    setIsRegistered(false)
                    setIsOnWaitlist(false)
                    toast.success('Erfolgreich abgemeldet')
                }
            }
        } catch (error) {
            console.error('Error unregistering from tour:', error)
        }
    }

    const handleAddToWaitlist = async () => {
        if (!user || !tour) return

        try {
            const success = await dataRepository.addToWaitlist(tourId, user.id)
            if (success) {
                const updatedTour = await dataRepository.getTourById(tourId)
                if (updatedTour) {
                    setTour(updatedTour)
                    setIsOnWaitlist(true)
                    toast.success('Zur Warteliste hinzugefügt')
                }
            }
        } catch (error) {
            console.error('Error adding to waitlist:', error)
        }
    }

    const handleRemoveFromWaitlist = async () => {
        if (!user || !tour) return

        try {
            const success = await dataRepository.removeFromWaitlist(tourId, user.id)
            if (success) {
                const updatedTour = await dataRepository.getTourById(tourId)
                if (updatedTour) {
                    setTour(updatedTour)
                    setIsOnWaitlist(false)
                    toast.success('Von Warteliste entfernt')
                }
            }
        } catch (error) {
            console.error('Error removing from waitlist:', error)
        }
    }

    const handleApprove = async () => {
        if (!user || !tour) return
        try {
            const updatedTour = await dataRepository.publishTour(tourId)
            if (updatedTour) {
                setTour(updatedTour)
                router.refresh()
                toast.success('Tour veröffentlicht')
            }
        } catch (error) {
            console.error('Error publishing tour:', error)
        }
    }

    const handleUnpublish = async () => {
        if (!user || !tour) return
        try {
            const updatedTour = await dataRepository.unpublishTour(tourId)
            if (updatedTour) {
                setTour(updatedTour)
                router.refresh()
                toast.success('Tour auf Entwurf gesetzt')
            }
        } catch (error) {
            console.error('Error unpublishing tour:', error)
        }
    }

    const handleCancel = async () => {
        if (!user || !tour) return

        try {
            const updatedTour = await dataRepository.cancelTour(tourId)
            if (updatedTour) {
                setTour(updatedTour)
                router.refresh()
                toast.success('Tour wurde abgesagt')
            }
        } catch (error) {
            console.error('Error cancelling tour:', error)
            toast.error('Fehler beim Absagen der Tour')
        } finally {
            setShowCancelDialog(false)
        }
    }

    const handleDelete = async () => {
        if (!user || !tour) return

        try {
            const success = await dataRepository.deleteTour(tourId)
            if (success) {
                toast.success('Tour wurde gelöscht')
                router.push('/tours')
            }
        } catch (error) {
            console.error('Error deleting tour:', error)
            toast.error('Fehler beim Löschen der Tour')
        } finally {
            setShowDeleteDialog(false)
        }
    }

    const handleSubmitForPublishing = async () => {
        if (!user || !tour) return

        try {
            const updatedTour = await dataRepository.submitTourForPublishing(tourId)
            if (updatedTour) {
                setTour(updatedTour)
                router.refresh()
                toast.success('Tour eingereicht')
            }
        } catch (error) {
            console.error('Error submitting tour for publishing:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col space-y-3 p-8">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        )
    }



    if (!tour || !user) return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <h1 className="text-2xl font-bold">Tour nicht gefunden</h1>
            <p>Die gesuchte Tour existiert nicht oder wurde entfernt.</p>
            <Button asChild>
                <Link href="/tours">Zurück zur Übersicht</Link>
            </Button>
        </div>
    )
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('de-CH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const canEdit = canEditTour(user.role, tour.leaderId, user.id, tour.status)
    const canPublish = canPublishTour(user.role)
    const canSubmit = canSubmitForPublishing(user.role, tour.leaderId, user.id, tour.status)
    const isFull = tour.participants.length >= tour.maxParticipants
    const isLeader = tour.leaderId === user.id

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tourDate = new Date(tour.date)
    tourDate.setHours(0, 0, 0, 0)
    const isArchived = tourDate < today

    const canRegister = tour.status === 'published' && !isRegistered && !isFull && !isLeader && !isArchived && !isOnWaitlist
    const canAddToWaitlist = tour.status === 'published' && !isRegistered && !isLeader && !isArchived && !isOnWaitlist

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            {/* Mobile: Map Button */}
            {tour.gpxFile && (
                <Button
                    onClick={() => setShowMapOnMobile(true)}
                    className="fixed bottom-20 right-4 sm:hidden z-40 inline-flex items-center gap-1 h-10 py-2 shadow-lg"
                >
                    <Map className="w-4 h-4" />
                    Karte
                </Button>
            )}

            {/* Mobile Map Fullscreen */}
            {tour.gpxFile && showMapOnMobile && (
                <div className="sm:hidden fixed inset-0 z-50 bg-background">
                    <div className="relative h-full w-full">
                        <Button
                            className="absolute top-4 right-4 z-[60]"
                            variant="outline"
                            onClick={() => setShowMapOnMobile(false)}
                        >
                            Schliessen
                        </Button>
                        <TourMap
                            gpxUrl={tour.gpxFile}
                            height="100%"
                            initialFullscreen={true}
                            onFullscreenChange={(isFullscreen) => {
                                if (!isFullscreen) setShowMapOnMobile(false)
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{tour.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Link href="/tours" className="hover:underline">Touren</Link>
                    <span>/</span>
                    <span className="text-foreground">{tour.title}</span>
                </div>
            </div>

            {/* Full-width Map Section */}
            {tour.gpxFile && (
                <div className="hidden sm:block overflow-hidden relative rounded-xl border bg-card shadow-sm">
                    <div className="h-[500px] w-full">
                        <TourMap gpxUrl={tour.gpxFile} height="100%" />
                    </div>
                    <Button variant="secondary" size="sm" asChild className="absolute bottom-4 right-4 z-10 shadow-lg">
                        <a href={tour.gpxFile} download className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            GPX herunterladen
                        </a>
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Beschreibung</h3>
                                <p className="whitespace-pre-wrap text-muted-foreground">{tour.description}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase">Datum</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">{formatDate(tour.date)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase">Dauer</span>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">{formatDuration(tour.duration)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase">Aufstieg</span>
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">{tour.elevation} Hm</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase">Schwierigkeit</span>
                                    <div className="flex items-center gap-2">
                                        <ChartNoAxesColumnIncreasing className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">{formatDifficulty(tour.difficulty, tour.tourType)}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{tour.tourType}</Badge>
                                <Badge variant="outline">{tour.tourLength}</Badge>
                                {tour.peak && <Badge variant="secondary">{tour.peak} ({tour.peakElevation} m)</Badge>}
                            </div>

                            {tour.leader && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={tour.leader.profilePhoto || undefined} />
                                            <AvatarFallback>{tour.leader.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium leading-none">{tour.leader.name}</span>
                                            <span className="text-xs text-muted-foreground">Tourenleiter</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Action Cards based on role/status */}

                    {/* Leader Draft Actions */}
                    {canSubmit && tour.status === 'draft' && !tour.submittedForPublishing && (
                        <Card className="bg-blue-50/50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-blue-700">Tour einreichen</CardTitle>
                                <CardDescription>Reiche die Tour zur Prüfung ein.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {canEdit && <Button variant="outline" className="w-full" asChild><Link href={`/tours/${tourId}/edit`}>Bearbeiten</Link></Button>}
                                <Button className="w-full" onClick={handleSubmitForPublishing}>Einreichen</Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Admin/Leader Published Actions */}
                    {canPublish && (
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle>Verwaltung</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {canEdit && <Button variant="outline" className="w-full" asChild><Link href={`/tours/${tourId}/edit`}>Bearbeiten</Link></Button>}

                                {tour.status === 'draft' && tour.submittedForPublishing && (
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleApprove}>Veröffentlichen</Button>
                                )}

                                {tour.status === 'published' && !isArchived && (
                                    <>
                                        <Button variant="outline" className="w-full" onClick={handleUnpublish}>Auf Entwurf setzen</Button>
                                        <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setShowCancelDialog(true)}>Absagen</Button>
                                    </>
                                )}

                                <Button variant="destructive" className="w-full" onClick={() => setShowDeleteDialog(true)}>Löschen</Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Registration Card */}
                    {tour.status === 'published' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Anmeldung</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Belegung</span>
                                        <span className="font-medium">{tour.participants.length} / {tour.maxParticipants}</span>
                                    </div>
                                    <Progress value={(Math.min(tour.participants.length, tour.maxParticipants) / tour.maxParticipants) * 100} />
                                    {manuallyAdded > 0 && <p className="text-xs text-muted-foreground">+ {manuallyAdded} manuell hinzugefügt</p>}
                                </div>

                                {isRegistered ? (
                                    <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium text-center">
                                        Du bist angemeldet
                                    </div>
                                ) : isOnWaitlist ? (
                                    <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md text-sm font-medium text-center">
                                        Du bist auf der Warteliste
                                    </div>
                                ) : null}

                                {!isArchived && (
                                    <>
                                        {canRegister && <Button className="w-full" onClick={handleRegister}>Anmelden</Button>}
                                        {canAddToWaitlist && <Button variant="secondary" className="w-full" onClick={handleAddToWaitlist}>{isFull ? 'Auf Warteliste' : 'Warteliste beitreten'}</Button>}
                                        {isRegistered && <Button variant="outline" className="w-full" onClick={handleUnregister}>Abmelden</Button>}
                                        {isOnWaitlist && <Button variant="outline" className="w-full" onClick={handleRemoveFromWaitlist}>Von Warteliste entfernen</Button>}
                                    </>
                                )}

                                {isArchived && <p className="text-center text-sm text-muted-foreground">Diese Tour hat bereits stattgefunden.</p>}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>WhatsApp Gruppe beitreten</DialogTitle>
                        <DialogDescription>
                            Tritt der WhatsApp Gruppe für diese Tour bei, um aktuelle Updates zu erhalten.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-4 space-y-4">
                        {tour.whatsappGroupLink && (
                            <>
                                <div className="w-[200px] h-[200px]">
                                    <QRCode data={tour.whatsappGroupLink} className="w-full h-full" />
                                </div>
                                <Button asChild className="w-full">
                                    <a href={tour.whatsappGroupLink} target="_blank" rel="noopener noreferrer">
                                        Link öffnen
                                    </a>
                                </Button>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowWhatsAppDialog(false)}>Schliessen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tour absagen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bist du sicher, dass du diese Tour absagen möchtest? Alle Teilnehmer werden informiert.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Ja, absagen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tour löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bist du sicher, dass du diese Tour unwiderruflich löschen möchtest?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Ja, löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
