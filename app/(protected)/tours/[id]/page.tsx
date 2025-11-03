'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourSettings } from '@/lib/types'
import { getTourIcon, getTourIconColor } from '@/lib/tourIcons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { canEditTour, canApproveTour, canPublishTour, canSubmitForPublishing } from '@/lib/roles'
import { formatDifficulty } from '@/lib/difficulty'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'

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
    if (!confirm('Möchten Sie diese Tour wirklich absagen?')) return

    try {
      const updatedTour = await dataRepository.cancelTour(tourId)
      if (updatedTour) {
        setTour(updatedTour)
        router.refresh()
      }
    } catch (error) {
      console.error('Error cancelling tour:', error)
    }
  }

  const handleDelete = async () => {
    if (!user || !tour) return
    if (!confirm('Möchten Sie diese Tour wirklich löschen?')) return

    try {
      const success = await dataRepository.deleteTour(tourId)
      if (success) {
        router.push('/tours')
      }
    } catch (error) {
      console.error('Error deleting tour:', error)
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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  if (!tour || !user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600 text-base">Tour nicht gefunden</p>
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
            <Link 
              href="/tours" 
              className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zur Übersicht
            </Link>
            <Link 
              href="/tours"
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target bg-gray-50 hover:bg-gray-100"
              aria-label="Zurück zur Übersicht"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = getTourIcon(tour.tourType, settings?.tourTypeIcons)
              const iconColor = getTourIconColor(tour.tourType)
              return <IconComponent className={`w-6 h-6 ${iconColor} flex-shrink-0`} strokeWidth={2} />
            })()}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{tour.title}</h1>
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
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Beschreibung</h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{tour.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <span className="text-xs font-medium text-gray-600 block mb-1">Datum:</span>
                  <p className="text-gray-900 text-sm">{formatDate(tour.date)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600 block mb-1">Dauer:</span>
                  <p className="text-gray-900 text-sm">{tour.duration} Stunden</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600 block mb-1">Höhenmeter:</span>
                  <p className="text-gray-900 text-sm">{tour.elevation} m</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600 block mb-1">Teilnehmer:</span>
                  <p className="text-gray-900 text-sm">
                    {tour.participants.length} / {tour.maxParticipants}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {tour.tourType}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {tour.tourLength}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {formatDifficulty(tour.difficulty, tour.tourType)}
                </span>
                {tour.status === 'draft' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    Entwurf
                  </span>
                )}
                {tour.status === 'published' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    Veröffentlicht
                  </span>
                )}
                {tour.status === 'draft' && tour.submittedForPublishing && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Zur Veröffentlichung eingereicht
                  </span>
                )}
                {tour.status === 'cancelled' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    Abgesagt
                  </span>
                )}
              </div>

              {tour.leader && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-600 block mb-2">Tourenleiter:</span>
                  <div className="flex items-center gap-2">
                    {tour.leader.profilePhoto ? (
                      <Image
                        src={tour.leader.profilePhoto}
                        alt={tour.leader.name}
                        width={32}
                        height={32}
                        unoptimized
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border border-gray-300 flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-600">
                          {tour.leader.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-900 text-sm font-medium">{tour.leader.name}</p>
                  </div>
                </div>
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
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-4">
                  Reichen Sie diese Tour zur Veröffentlichung ein. Ein Admin wird sie prüfen und veröffentlichen.
                </p>
                <Button variant="default" onClick={handleSubmitForPublishing} className="w-full" size="sm">
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
                <Button variant="default" onClick={handleApprove} className="w-full" size="sm" disabled={isArchived}>
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
            <Card className="border-gray-300 bg-gray-50/50">
              <CardHeader>
                <CardTitle className="text-gray-800 text-base">Admin-Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="default" onClick={handleApprove} className="w-full" size="sm" disabled={isArchived}>
                  Tour veröffentlichen
                </Button>
                {isArchived && (
                  <p className="text-xs text-gray-600 mt-2">
                    Archivierte Touren können nicht mehr veröffentlicht werden.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {canPublish && tour.status === 'published' && (
            <Card className="border-gray-300 bg-gray-50/50">
              <CardHeader>
                <CardTitle className="text-gray-800 text-base">Verwaltung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isArchived && (
                  <>
                    <Button variant="outline" onClick={handleCancel} className="w-full" size="sm">
                      Tour absagen
                    </Button>
                    <Button variant="outline" onClick={handleUnpublish} className="w-full" size="sm">
                      Auf Entwurf setzen
                    </Button>
                  </>
                )}
                <Button variant="destructive" onClick={handleDelete} className="w-full" size="sm">
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
                    <Button variant="default" onClick={handleApprove} className="w-full" size="sm">
                      Tour wieder aktivieren
                    </Button>
                    <Button variant="outline" onClick={handleUnpublish} className="w-full" size="sm">
                      Auf Entwurf setzen
                    </Button>
                  </>
                )}
                <Button variant="destructive" onClick={handleDelete} className="w-full" size="sm">
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
                  <p className="text-xs text-gray-600 mb-2">
                    {tour.participants.length} von {tour.maxParticipants} Plätzen belegt
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(tour.participants.length / tour.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {isRegistered ? (
                  <div className="space-y-2">
                    <p className="text-xs text-green-600 font-medium">Sie sind angemeldet</p>
                    <Button variant="destructive" onClick={handleUnregister} className="w-full" size="sm">
                      Abmelden
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isFull ? (
                      <p className="text-xs text-red-600 font-medium">Tour ist ausgebucht</p>
                    ) : !canRegister ? (
                      <p className="text-xs text-gray-600 font-medium">
                        {isLeader 
                          ? 'Sie sind der Tourenleiter' 
                          : isArchived 
                          ? 'Diese Tour liegt in der Vergangenheit'
                          : 'Anmeldung nicht möglich'}
                      </p>
                    ) : (
                      <Button
                        variant="default"
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
                      {participant.profilePhoto ? (
                        <Image
                          src={participant.profilePhoto}
                          alt={participant.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="w-8 h-8 rounded-full object-cover border border-gray-300 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border border-gray-300 flex-shrink-0">
                          <span className="text-xs font-semibold text-primary-600">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{participant.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Tour ablehnen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Möchten Sie diese Tour wirklich ablehnen? Sie können optional einen Kommentar hinzufügen.
              </p>
              <Textarea
                label="Kommentar (optional)"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Grund für die Ablehnung..."
                rows={4}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  onClick={handleConfirmReject}
                  className="flex-1"
                  size="sm"
                >
                  Ablehnen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionComment('')
                  }}
                  className="flex-1"
                  size="sm"
                >
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

