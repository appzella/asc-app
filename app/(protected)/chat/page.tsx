'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, ChatMessage } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getUnreadCount, getLastReadTimestamp } from '@/lib/chat/useUnreadMessages'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface ChatWithLastMessage extends Tour {
  lastMessage?: ChatMessage
  unreadCount: number
}

export default function ChatOverviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<ChatWithLastMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      loadChats()
    }

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadChats = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const allTours = await dataRepository.getTours()
      
      // Filtere Touren, bei denen der User angemeldet ist oder Leader ist
      const userTours = allTours.filter(tour => 
        tour.status === 'published' && 
        (tour.participants.includes(user.id) || tour.leaderId === user.id)
      )

      // Lade für jede Tour die letzte Nachricht und berechne unread count
      const chatsWithMessages = await Promise.all(
        userTours.map(async (tour) => {
          try {
            const messages = await dataRepository.getMessagesByTourId(tour.id)
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined
            const unreadCount = getUnreadCount(messages, tour.id)

            return {
              ...tour,
              lastMessage,
              unreadCount,
            }
          } catch (error) {
            console.error(`Error loading messages for tour ${tour.id}:`, error)
            return {
              ...tour,
              lastMessage: undefined,
              unreadCount: 0,
            }
          }
        })
      )

      // Sortiere nach letzter Nachricht (neueste zuerst)
      chatsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0
        if (!a.lastMessage) return 1
        if (!b.lastMessage) return -1
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      })

      setChats(chatsWithMessages)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Initial load
  useEffect(() => {
    if (user) {
      loadChats()
    }
  }, [user, loadChats])

  // Realtime-Updates für neue Nachrichten
  useEffect(() => {
    if (!user) return

    // Realtime subscription für Chat-Updates
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`chat-overview:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
          },
          async () => {
            // Reload chats when new messages arrive
            if (user) {
              await loadChats()
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      // Polling fallback
      const interval = setInterval(() => {
        if (user) {
          loadChats()
        }
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [user, loadChats])

  const formatLastMessageTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: de 
      })
    } catch {
      return ''
    }
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-muted-foreground">Bitte melde dich an.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gruppenchats für deine Touren
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Noch keine Chats verfügbar. Melde dich bei einer Tour an, um am Chat teilzunehmen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar des letzten Absenders oder Tour-Icon */}
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      {chat.lastMessage?.user?.profilePhoto ? (
                        <AvatarImage
                          src={chat.lastMessage.user.profilePhoto}
                          alt={chat.lastMessage.user.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback>
                        {chat.lastMessage?.user?.name?.charAt(0).toUpperCase() || 
                         chat.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{chat.title}</h3>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="flex-shrink-0">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {chat.lastMessage ? (
                        <>
                          <p className="text-sm text-muted-foreground truncate">
                            <span className="font-medium">
                              {chat.lastMessage.userId === user.id 
                                ? 'Du' 
                                : chat.lastMessage.user?.name || 'Unbekannt'}
                            </span>
                            {': '}
                            {chat.lastMessage.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatLastMessageTime(chat.lastMessage.createdAt)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Noch keine Nachrichten
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

