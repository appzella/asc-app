'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour } from '@/lib/types'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { markTourAsRead, useUnreadCount } from '@/lib/chat/useUnreadMessages'
import { ChevronLeft, ArrowLeft } from 'lucide-react'

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.tourId as string

  const [user, setUser] = useState<User | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Berechne unread count und markiere als gelesen beim Öffnen
  const { unreadCount, markAsRead } = useUnreadCount(tourId, user?.id || null)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      loadTour()
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [tourId])

  useEffect(() => {
    // Markiere als gelesen, wenn der Chat geöffnet wird
    if (tour && user) {
      // Warte kurz, damit die Nachrichten geladen sind
      const timer = setTimeout(() => {
        markAsRead()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [tour, user, markAsRead])

  const loadTour = async () => {
    try {
      setIsLoading(true)
      const tourData = await dataRepository.getTourById(tourId)
      
      if (!tourData) {
        router.push('/chat')
        return
      }

      // Prüfe ob User Teilnehmer oder Leader ist
      const currentUser = authService.getCurrentUser()
      if (!currentUser) {
        router.push('/chat')
        return
      }

      const isParticipant = tourData.participants.includes(currentUser.id)
      const isLeader = tourData.leaderId === currentUser.id

      if (!isParticipant && !isLeader) {
        // User hat keinen Zugriff auf diesen Chat
        router.push('/chat')
        return
      }

      setTour(tourData)
    } catch (error) {
      console.error('Error loading tour:', error)
      router.push('/chat')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tour || !user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground text-base">Chat nicht gefunden</p>
          <Button variant="outline" onClick={() => router.push('/chat')} className="mt-4">
            Zurück zur Chat-Übersicht
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header mit Zurück-Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/chat')}
          className="h-9 w-9 p-0"
          aria-label="Zurück zur Chat-Übersicht"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{tour.title}</h1>
          <p className="text-sm text-muted-foreground">
            Gruppenchat für diese Tour
          </p>
        </div>
      </div>

      {/* Chat Window */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <ChatWindow tourId={tourId} userId={user.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

