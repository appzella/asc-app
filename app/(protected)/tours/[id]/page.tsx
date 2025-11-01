'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { canEditTour, canApproveTour, canPublishTour, canSubmitForPublishing } from '@/lib/roles'
import { formatDifficulty } from '@/lib/difficulty'
import Link from 'next/link'
import Image from 'next/image'

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
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
          const tourData = await dataRepository.getTourById(tourId)
          if (!tourData) {
            router.push('/tours')
            return
          }
          setTour(tourData)
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
    return <div>Lädt...</div>
  }

  if (!tour || !user) {
    return <div>Tour nicht gefunden</div>
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
  const canRegister = tour.status === 'published' && !isRegistered && !isFull && !isLeader

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/tours" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{tour.title}</h1>
        </div>
        {canEdit && (
          <Link href={`/tours/${tourId}/edit`}>
            <Button variant="outline">Tour bearbeiten</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tour Details */}
          <Card>
            <CardHeader>
              <CardTitle>Tour-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Beschreibung</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{tour.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-sm font-medium text-gray-700">Datum:</span>
                  <p className="text-gray-900">{formatDate(tour.date)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Dauer:</span>
                  <p className="text-gray-900">{tour.duration} Stunden</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Höhenmeter:</span>
                  <p className="text-gray-900">{tour.elevation} m</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Teilnehmer:</span>
                  <p className="text-gray-900">
                    {tour.participants.length} / {tour.maxParticipants}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {tour.tourType}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {tour.tourLength}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {formatDifficulty(tour.difficulty, tour.tourType)}
                </span>
                {tour.status === 'draft' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Entwurf
                  </span>
                )}
                {tour.status === 'published' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Veröffentlicht
                  </span>
                )}
                {tour.status === 'draft' && tour.submittedForPublishing && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Zur Veröffentlichung eingereicht
                  </span>
                )}
                {tour.status === 'cancelled' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Abgesagt
                  </span>
                )}
              </div>

              {tour.leader && (
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium text-gray-700">Tourenleiter:</span>
                  <p className="text-gray-900">{tour.leader.name}</p>
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
        <div className="space-y-6">
          {/* Leader Actions */}
          {canSubmit && tour.status === 'draft' && !tour.submittedForPublishing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Tour einreichen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary-600 opacity-90 mb-4">
                  Reichen Sie diese Tour zur Veröffentlichung ein. Ein Admin wird sie prüfen und veröffentlichen.
                </p>
                <Button variant="primary" onClick={handleSubmitForPublishing} className="w-full">
                  Zur Veröffentlichung einreichen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions - Tour zur Veröffentlichung eingereicht */}
          {canPublish && tour.status === 'draft' && tour.submittedForPublishing && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Veröffentlichung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="primary" onClick={handleApprove} className="w-full">
                  Tour veröffentlichen
                </Button>
                <Button variant="outline" onClick={handleUnpublish} className="w-full">
                  Auf Entwurf zurücksetzen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions - Tour im Entwurf (nicht eingereicht) */}
          {canPublish && tour.status === 'draft' && !tour.submittedForPublishing && (
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-gray-800">Admin-Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="primary" onClick={handleApprove} className="w-full">
                  Tour veröffentlichen
                </Button>
              </CardContent>
            </Card>
          )}

          {canPublish && tour.status === 'published' && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Verwaltung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" onClick={handleCancel} className="w-full">
                  Tour absagen
                </Button>
                <Button variant="outline" onClick={handleUnpublish} className="w-full">
                  Auf Entwurf setzen
                </Button>
                <Button variant="danger" onClick={handleDelete} className="w-full">
                  Tour löschen
                </Button>
              </CardContent>
            </Card>
          )}

          {canPublish && tour.status === 'cancelled' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Verwaltung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="primary" onClick={handleApprove} className="w-full">
                  Tour wieder aktivieren
                </Button>
                <Button variant="outline" onClick={handleUnpublish} className="w-full">
                  Auf Entwurf setzen
                </Button>
                <Button variant="danger" onClick={handleDelete} className="w-full">
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
                  <p className="text-sm text-gray-600 mb-2">
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
                    <p className="text-sm text-green-600 font-medium">Sie sind angemeldet</p>
                    <Button variant="danger" onClick={handleUnregister} className="w-full">
                      Abmelden
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isFull ? (
                      <p className="text-sm text-red-600 font-medium">Tour ist ausgebucht</p>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleRegister}
                        className="w-full"
                        disabled={user.role === 'admin'}
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
                <ul className="space-y-2">
                  {participants.map((participant) => (
                    <li key={participant.id} className="flex items-center gap-3 text-sm text-gray-700">
                      {participant.profilePhoto ? (
                        <Image
                          src={participant.profilePhoto}
                          alt={participant.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
                          <span className="text-xs font-semibold text-primary-600">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{participant.name}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  variant="danger"
                  onClick={handleConfirmReject}
                  className="flex-1"
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

