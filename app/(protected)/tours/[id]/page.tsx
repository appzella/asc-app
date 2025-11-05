'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourSettings } from '@/lib/types'
import { getTourIcon } from '@/lib/tourIcons'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
import { Skeleton } from '@/components/ui/skeleton'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { canEditTour, canApproveTour, canPublishTour, canSubmitForPublishing } from '@/lib/roles'
import { formatDifficulty } from '@/lib/difficulty'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, Calendar, Clock, ArrowUpRight, Users, ChartNoAxesColumnIncreasing } from 'lucide-react'
import { toast } from 'sonner'

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [settings, setSettings] = useState<TourSettings | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionComment, setRejectionComment] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const loadTour = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        try {
          const [tourData, tourSettings] = await Promise.all([
            dataRepository.getTourById(tourId),
            dataRepository.getSettings()
          ])
          
          if (!tourData) {
            router.push('/tours')
            return
          }
          setTour(tourData)
          setSettings(tourSettings)
          setIsRegistered(tourData.participants.includes(currentUser.id))

          // Load participant details
          const participantUsers = await Promise.all(
            tourData.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
        } catch (error) {
          console.error('Error loading tour:', error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error('Error details:', errorMessage)
          router.push('/tours')
        }
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
          setIsRegistered(true)
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
        }
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
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
        }
      }
    } catch (error) {
      console.error('Error unregistering from tour:', error)
    }
  }

  const handleApprove = async () => {
    if (!user || !tour) return

    try {
      const updatedTour = await dataRepository.publishTour(tourId)
      if (updatedTour) {
        setTour(updatedTour)
        router.refresh()
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
      }
    } catch (error) {
      console.error('Error unpublishing tour:', error)
    }
  }

  const handleSubmitForPublishing = async () => {
    if (!user || !tour) return

    try {
      const updatedTour = await dataRepository.submitTourForPublishing(tourId)
      if (updatedTour) {
        setTour(updatedTour)
        router.refresh()
      }
    } catch (error) {
      console.error('Error submitting tour for publishing:', error)
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

  const handleReject = () => {
    if (!user || !tour) return
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!user || !tour) return

    try {
      const updatedTour = await dataRepository.unpublishTour(tourId)
      if (updatedTour) {
        setTour(updatedTour)
        setShowRejectModal(false)
        setRejectionComment('')
        router.refresh()
      }
    } catch (error) {
      console.error('Error rejecting tour:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-8 w-48" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!tour || !user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground text-base">Tour nicht gefunden</p>
        </CardContent>
      </Card>
    )
  }

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
  
  // Prüfe ob Tour archiviert ist (Datum in der Vergangenheit)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tourDate = new Date(tour.date)
  tourDate.setHours(0, 0, 0, 0)
  const isArchived = tourDate < today
  
  const canRegister = tour.status === 'published' && !isRegistered && !isFull && !isLeader && !isArchived

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
            >
              <Link href="/tours">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                Zurück zur Übersicht
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = getTourIcon(tour.tourType, settings?.tourTypeIcons)
              return <IconComponent className="w-6 h-6 text-foreground flex-shrink-0" strokeWidth={2} />
            })()}
            <h1>{tour.title}</h1>
          </div>
        </div>
        {canEdit && (
          <Link href={`/tours/${tourId}/edit`}>
            <Button variant="outline" size="sm">Tour bearbeiten</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Tour Details */}
          <Card>
            <CardHeader>
              <CardTitle>Tour-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2">Beschreibung</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{tour.description}</p>
              </div>

              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs">{formatDate(tour.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs">{tour.duration} h</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs">{tour.elevation} Hm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs">{tour.participants.length}/{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChartNoAxesColumnIncreasing className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs">{formatDifficulty(tour.difficulty, tour.tourType)}</span>
                </div>
              </div>

              <Separator />
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {tour.tourType}
                </Badge>
                <Badge variant="outline">
                  {tour.tourLength}
                </Badge>
                {tour.status === 'draft' && (
                  <Badge variant="outline-warning">
                    Entwurf
                  </Badge>
                )}
                {tour.status === 'published' && (
                  <Badge variant="outline-success">
                    Veröffentlicht
                  </Badge>
                )}
                {tour.status === 'draft' && tour.submittedForPublishing && (
                  <Badge variant="outline-warning">
                    Zur Veröffentlichung eingereicht
                  </Badge>
                )}
                {tour.status === 'cancelled' && (
                  <Badge variant="outline-destructive">
                    Abgesagt
                  </Badge>
                )}
              </div>

              {tour.leader && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-2">Tourenleiter:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage
                          src={tour.leader.profilePhoto || undefined}
                          alt={tour.leader.name}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {tour.leader.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-foreground text-sm font-medium">{tour.leader.name}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chat - nur bei veröffentlichten Touren */}
          {tour.status === 'published' && (
            <Card>
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <ChatWindow tourId={tourId} userId={user.id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Leader Actions */}
          {canSubmit && tour.status === 'draft' && !tour.submittedForPublishing && (
            <Card className="border-blue-300 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-800 text-base">Tour einreichen</CardTitle>
                <CardDescription className="text-xs">
                  Reiche diese Tour zur Veröffentlichung ein. Ein Admin wird sie prüfen und veröffentlichen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="warning" onClick={handleSubmitForPublishing} className="w-full" size="sm">
                  Zur Veröffentlichung einreichen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions - Tour zur Veröffentlichung eingereicht */}
          {canPublish && tour.status === 'draft' && tour.submittedForPublishing && (
            <Card className="border-yellow-300 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="text-yellow-800 text-base">Veröffentlichung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="success" onClick={handleApprove} className="w-full" size="sm" disabled={isArchived}>
                  Tour veröffentlichen
                </Button>
                {!isArchived && (
                  <Button variant="outline" onClick={handleUnpublish} className="w-full" size="sm">
                    Auf Entwurf zurücksetzen
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin Actions - Tour im Entwurf (nicht eingereicht) */}
          {canPublish && tour.status === 'draft' && !tour.submittedForPublishing && (
            <Card className="border-border bg-muted/50">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Admin-Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="success" onClick={handleApprove} className="w-full" size="sm" disabled={isArchived}>
                  Tour veröffentlichen
                </Button>
                {isArchived && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Archivierte Touren können nicht mehr veröffentlicht werden.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {canPublish && tour.status === 'published' && (
            <Card className="border-border bg-muted/50">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Verwaltung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isArchived && (
                  <>
                    <Button variant="outline" onClick={handleUnpublish} className="w-full" size="sm">
                      Auf Entwurf setzen
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCancelDialog(true)} 
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                      size="sm"
                    >
                      Tour absagen
                    </Button>
                  </>
                )}
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full" size="sm">
                  Tour löschen
                </Button>
              </CardContent>
            </Card>
          )}

          {canPublish && tour.status === 'cancelled' && (
            <Card className="border-red-300 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-800 text-base">Verwaltung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isArchived && (
                  <>
                    <Button variant="outline" onClick={handleUnpublish} className="w-full" size="sm">
                      Auf Entwurf setzen
                    </Button>
                    <Button variant="success" onClick={handleApprove} className="w-full" size="sm">
                      Tour wieder aktivieren
                    </Button>
                  </>
                )}
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full" size="sm">
                  Tour löschen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Anmeldung */}
          {tour.status === 'published' && (
            <Card>
              <CardHeader>
                <CardTitle>Anmeldung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {tour.participants.length} von {tour.maxParticipants} Plätzen belegt
                  </p>
                  <Progress value={(tour.participants.length / tour.maxParticipants) * 100} className="h-2" />
                </div>

                {isRegistered ? (
                  <div className="space-y-2">
                    <p className="text-xs text-green-600 font-medium">Du bist angemeldet</p>
                    <Button variant="outline" onClick={handleUnregister} className="w-full" size="sm">
                      Abmelden
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isFull ? (
                      <p className="text-xs text-red-600 font-medium">Tour ist ausgebucht</p>
                    ) : !canRegister ? (
                      <p className="text-xs text-muted-foreground font-medium">
                        {isLeader 
                          ? 'Du bist der Tourenleiter' 
                          : isArchived 
                          ? 'Diese Tour liegt in der Vergangenheit'
                          : 'Anmeldung nicht möglich'}
                      </p>
                    ) : (
                      <Button
                        variant="success"
                        onClick={handleRegister}
                        className="w-full"
                        size="sm"
                      >
                        Anmelden
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Teilnehmerliste */}
          {participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Teilnehmer ({participants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {participants.map((participant) => (
                    <li key={participant.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage
                          src={participant.profilePhoto || undefined}
                          alt={participant.name}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {participant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{participant.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tour ablehnen</DialogTitle>
            <DialogDescription>
              Möchtest du diese Tour wirklich ablehnen? Du kannst optional einen Kommentar hinzufügen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-comment">Kommentar (optional)</Label>
              <Textarea
                id="rejection-comment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Grund für die Ablehnung..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false)
                setRejectionComment('')
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
            >
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Tour Alert Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tour absagen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Tour wirklich absagen? Die Tour wird als abgesagt markiert und ist nicht mehr für Anmeldungen verfügbar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tour absagen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tour Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tour löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Tour wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tour löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

