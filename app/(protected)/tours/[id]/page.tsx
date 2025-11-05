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
import { ChevronLeft, Calendar, Clock, ArrowUpRight, Users, ChartNoAxesColumnIncreasing, X, UserPlus } from 'lucide-react'
import TourMap from '@/components/tours/TourMap'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { toast } from 'sonner'

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [settings, setSettings] = useState<TourSettings | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [waitlist, setWaitlist] = useState<User[]>([])
  const [isRegistered, setIsRegistered] = useState(false)
  const [isOnWaitlist, setIsOnWaitlist] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionComment, setRejectionComment] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRemoveParticipantDialog, setShowRemoveParticipantDialog] = useState(false)
  const [participantToRemove, setParticipantToRemove] = useState<User | null>(null)
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])

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
          setIsOnWaitlist(tourData.waitlist?.includes(currentUser.id) || false)

          // Load participant details
          const participantUsers = await Promise.all(
            tourData.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))

          // Load waitlist details
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
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
          setIsRegistered(updatedTour.participants.includes(user.id))
          setIsOnWaitlist(updatedTour.waitlist?.includes(user.id) || false)
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
          // Reload waitlist
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
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
          setIsOnWaitlist(false)
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
          // Reload waitlist
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
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
          // Reload waitlist
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
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
          // Reload waitlist
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
        }
      }
    } catch (error) {
      console.error('Error removing from waitlist:', error)
    }
  }

  const handleRemoveParticipantClick = (participant: User) => {
    setParticipantToRemove(participant)
    setShowRemoveParticipantDialog(true)
  }

  const handleConfirmRemoveParticipant = async () => {
    if (!user || !tour || !participantToRemove) return

    try {
      const success = await dataRepository.unregisterFromTour(tourId, participantToRemove.id)
      if (success) {
        const updatedTour = await dataRepository.getTourById(tourId)
        if (updatedTour) {
          setTour(updatedTour)
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
          // Reload waitlist (in case someone was promoted)
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
          toast.success('Teilnehmer wurde von der Tour entfernt')
        }
      }
    } catch (error) {
      console.error('Error removing participant:', error)
      toast.error('Fehler beim Entfernen des Teilnehmers')
    } finally {
      setShowRemoveParticipantDialog(false)
      setParticipantToRemove(null)
    }
  }

  const handleAddParticipantClick = async () => {
    if (!user || !tour) return
    try {
      const users = await dataRepository.getUsers()
      // Filtere bereits angemeldete Teilnehmer und den aktuellen User
      const availableUsers = users.filter(
        (u) => u.id !== user.id && !tour.participants.includes(u.id) && u.active
      )
      setAllUsers(availableUsers)
      setShowAddParticipantDialog(true)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Fehler beim Laden der Benutzer')
    }
  }

  const handleAddParticipant = async (userId: string) => {
    if (!user || !tour) return

    try {
      const success = await dataRepository.addParticipantManually(tourId, userId)
      if (success) {
        const updatedTour = await dataRepository.getTourById(tourId)
        if (updatedTour) {
          setTour(updatedTour)
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
          // Reload waitlist
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
          
          const addedUser = await dataRepository.getUserById(userId)
          toast.success(`${addedUser?.name || 'Teilnehmer'} wurde zur Tour hinzugefügt`)
          setShowAddParticipantDialog(false)
        }
      } else {
        toast.error('Fehler beim Hinzufügen des Teilnehmers')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      toast.error('Fehler beim Hinzufügen des Teilnehmers')
    }
  }

  const handlePromoteFromWaitlist = async (userId: string) => {
    if (!user || !tour) return

    try {
      const success = await dataRepository.promoteFromWaitlist(tourId, userId)
      if (success) {
        const updatedTour = await dataRepository.getTourById(tourId)
        if (updatedTour) {
          setTour(updatedTour)
          // Reload participants
          const participantUsers = await Promise.all(
            updatedTour.participants.map((id) => dataRepository.getUserById(id))
          )
          setParticipants(participantUsers.filter((u): u is User => u !== null))
          // Reload waitlist
          const waitlistUsers = await dataRepository.getWaitlistByTourId(tourId)
          setWaitlist(waitlistUsers)
          toast.success('Person wurde von der Warteliste hinzugefügt')
        }
      }
    } catch (error) {
      console.error('Error promoting from waitlist:', error)
      toast.error('Fehler beim Hinzufügen von der Warteliste')
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
  const canManageWaitlist = isLeader || user.role === 'admin'
  const manuallyAdded = Math.max(0, tour.participants.length - tour.maxParticipants)
  
  // Prüfe ob Tour archiviert ist (Datum in der Vergangenheit)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tourDate = new Date(tour.date)
  tourDate.setHours(0, 0, 0, 0)
  const isArchived = tourDate < today
  
  // Kann sich normal anmelden (nur wenn Tour nicht voll ist)
  const canRegister = tour.status === 'published' && !isRegistered && !isFull && !isLeader && !isArchived && !isOnWaitlist
  // Kann sich auf Warteliste setzen (wenn Tour voll ist oder wenn Tour nicht voll aber User möchte explizit auf Warteliste)
  const canAddToWaitlist = tour.status === 'published' && !isRegistered && !isLeader && !isArchived && !isOnWaitlist

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
                  <span className="text-xs">
                    {tour.participants.length}/{tour.maxParticipants}
                    {manuallyAdded > 0 && `+${manuallyAdded}`}
                  </span>
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
                      <span className="text-foreground text-sm font-medium leading-none">{tour.leader.name}</span>
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
          {/* Karte mit GPX-Track - ganz oben in der rechten Spalte */}
          {tour.gpxFile && (
            <Card>
              <CardHeader>
                <CardTitle>Tour-Verlauf</CardTitle>
                <CardDescription>
                  Visualisierung der Tour auf einer Karte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TourMap gpxUrl={tour.gpxFile} height="500px" />
              </CardContent>
            </Card>
          )}
          {/* Leader Actions */}
          {canSubmit && tour.status === 'draft' && !tour.submittedForPublishing && (
            <Card className="border-blue-300 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-800 text-base">Tour einreichen</CardTitle>
                <CardDescription className="text-xs">
                  Reiche diese Tour zur Veröffentlichung ein. Ein Admin wird sie prüfen und veröffentlichen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {canEdit && (
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <Link href={`/tours/${tourId}/edit`}>Tour bearbeiten</Link>
                  </Button>
                )}
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
                {canEdit && (
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <Link href={`/tours/${tourId}/edit`}>Tour bearbeiten</Link>
                  </Button>
                )}
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
                {canEdit && (
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <Link href={`/tours/${tourId}/edit`}>Tour bearbeiten</Link>
                  </Button>
                )}
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
                {canEdit && (
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <Link href={`/tours/${tourId}/edit`}>Tour bearbeiten</Link>
                  </Button>
                )}
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
                {canEdit && (
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <Link href={`/tours/${tourId}/edit`}>Tour bearbeiten</Link>
                  </Button>
                )}
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
                    {manuallyAdded > 0 && ` (+${manuallyAdded} manuell hinzugefügt)`}
                  </p>
                  <Progress value={(Math.min(tour.participants.length, tour.maxParticipants) / tour.maxParticipants) * 100} className="h-2" />
                </div>

                {isRegistered ? (
                  <div className="space-y-2">
                    <p className="text-xs text-green-600 font-medium">Du bist angemeldet</p>
                    <Button variant="outline" onClick={handleUnregister} className="w-full" size="sm">
                      Abmelden
                    </Button>
                  </div>
                ) : isOnWaitlist ? (
                  <div className="space-y-2">
                    <p className="text-xs text-yellow-600 font-medium">Du bist auf der Warteliste</p>
                    <Button variant="outline" onClick={handleRemoveFromWaitlist} className="w-full" size="sm">
                      Von Warteliste entfernen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isFull ? (
                      <>
                        <p className="text-xs text-red-600 font-medium mb-2">Tour ist ausgebucht</p>
                        {canAddToWaitlist ? (
                          <Button
                            variant="outline"
                            onClick={handleAddToWaitlist}
                            className="w-full"
                            size="sm"
                          >
                            Auf Warteliste setzen
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground font-medium">
                            {isLeader 
                              ? 'Du bist der Tourenleiter' 
                              : isArchived 
                              ? 'Diese Tour liegt in der Vergangenheit'
                              : 'Anmeldung nicht möglich'}
                          </p>
                        )}
                      </>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Teilnehmer ({participants.length})</CardTitle>
                {canManageWaitlist && tour.status === 'published' && !isArchived && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddParticipantClick}
                    className="h-8"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Hinzufügen
                  </Button>
                )}
              </div>
            </CardHeader>
            {participants.length > 0 ? (
              <CardContent>
                <ul className="space-y-3">
                  {participants.map((participant) => (
                    <li key={participant.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
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
                      </div>
                      {canManageWaitlist && participant.id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParticipantClick(participant)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            ) : (
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Noch keine Teilnehmer angemeldet
                </p>
              </CardContent>
            )}
          </Card>

          {/* Warteliste */}
          {tour.status === 'published' && waitlist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Warteliste ({waitlist.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {waitlist.map((waitlistUser) => (
                    <li key={waitlistUser.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage
                            src={waitlistUser.profilePhoto || undefined}
                            alt={waitlistUser.name}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {waitlistUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{waitlistUser.name}</span>
                      </div>
                      {canManageWaitlist && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromoteFromWaitlist(waitlistUser.id)}
                        >
                          Hinzufügen
                        </Button>
                      )}
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

      {/* Remove Participant Alert Dialog */}
      <AlertDialog open={showRemoveParticipantDialog} onOpenChange={setShowRemoveParticipantDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teilnehmer entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du <strong>{participantToRemove?.name}</strong> wirklich von dieser Tour entfernen?
              {tour && tour.participants.length >= tour.maxParticipants && waitlist.length > 0 && (
                <span className="block mt-2 text-sm">
                  Der erste Teilnehmer von der Warteliste wird automatisch nachrücken.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setParticipantToRemove(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRemoveParticipant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Participant Dialog */}
      <CommandDialog open={showAddParticipantDialog} onOpenChange={setShowAddParticipantDialog}>
        <Command>
          <CommandInput placeholder="Benutzer suchen..." />
          <CommandList>
            <CommandEmpty>Keine Benutzer gefunden.</CommandEmpty>
            <CommandGroup heading="Benutzer">
              {allUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => handleAddParticipant(user.id)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={user.profilePhoto || undefined}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}

