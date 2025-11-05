'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, ChatMessage } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getUnreadCount } from '@/lib/chat/useUnreadMessages'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface ChatWithLastMessage extends Tour {
  lastMessage?: ChatMessage
  unreadCount: number
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<ChatWithLastMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

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

  // Setze ausgewählten Chat basierend auf URL-Parameter oder erstem Chat
  useEffect(() => {
    const tourId = searchParams.get('tourId')
    if (tourId && chats.some(chat => chat.id === tourId)) {
      setSelectedChatId(tourId)
    } else if (chats.length > 0 && !selectedChatId) {
      // Wenn kein Chat ausgewählt ist, wähle den ersten Chat
      setSelectedChatId(chats[0].id)
    }
  }, [searchParams, chats, selectedChatId])

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

  const selectedChat = chats.find(chat => chat.id === selectedChatId)

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
    router.push(`/chat?tourId=${chatId}`, { scroll: false })
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
    <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-8rem)] flex flex-col border rounded-lg overflow-hidden bg-background">
      {/* Desktop: Zwei-Spalten-Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Linke Spalte: Chat-Liste */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Chat</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Gruppenchats für deine Touren
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Noch keine Chats verfügbar. Melde dich bei einer Tour an, um am Chat teilzunehmen.
                </p>
              </div>
            ) : (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                      selectedChatId === chat.id
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
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
                            <Badge variant="default" className="flex-shrink-0 h-5 min-w-5 px-1.5 text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        {chat.lastMessage ? (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              <span className="font-medium">
                                {chat.lastMessage.userId === user.id 
                                  ? 'Du' 
                                  : chat.lastMessage.user?.name || 'Unbekannt'}
                              </span>
                              {': '}
                              {chat.lastMessage.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatLastMessageTime(chat.lastMessage.createdAt)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Noch keine Nachrichten
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Chat-View */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{selectedChat.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Gruppenchat für diese Tour
                </p>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <ChatWindow tourId={selectedChat.id} userId={user.id} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Wähle einen Chat aus, um die Nachrichten anzuzeigen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Einzelansicht mit Navigation */}
      <div className="md:hidden flex flex-col flex-1">
        {selectedChatId && selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <button
                onClick={() => setSelectedChatId(null)}
                className="p-2 hover:bg-accent rounded-md"
                aria-label="Zurück zur Chat-Liste"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <div className="flex-1">
                <h2 className="text-base font-semibold">{selectedChat.title}</h2>
                <p className="text-xs text-muted-foreground">
                  Gruppenchat für diese Tour
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <ChatWindow tourId={selectedChat.id} userId={user.id} />
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Chat</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Gruppenchats für deine Touren
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Noch keine Chats verfügbar. Melde dich bei einer Tour an, um am Chat teilzunehmen.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className="p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors mb-1"
                    >
                      <div className="flex items-start gap-3">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

