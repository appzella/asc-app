'use client'

import { useEffect, useState, useRef } from 'react'
import { dataRepository } from '@/lib/data'
import { ChatMessage } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Send } from 'lucide-react'
import { markTourAsRead } from '@/lib/chat/useUnreadMessages'

interface ChatWindowProps {
  tourId: string
  userId: string
  onMessagesLoaded?: (messages: ChatMessage[]) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ tourId, userId, onMessagesLoaded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const tourMessages = await dataRepository.getMessagesByTourId(tourId)
        setMessages(tourMessages)
        
        // Markiere als gelesen, wenn Nachrichten geladen sind
        if (tourMessages.length > 0) {
          const newestMessage = tourMessages[tourMessages.length - 1]
          markTourAsRead(tourId, newestMessage.createdAt)
        }
        
        if (onMessagesLoaded) {
          onMessagesLoaded(tourMessages)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setIsLoading(false)
        // After initial load, set flag to false
        setTimeout(() => {
          isInitialLoad.current = false
        }, 100)
      }
    }

    loadMessages()
  }, [tourId])

  // Set up Supabase Realtime subscription for chat messages
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback to polling if Supabase is not configured
      const interval = setInterval(async () => {
        try {
          const tourMessages = await dataRepository.getMessagesByTourId(tourId)
          setMessages(tourMessages)
        } catch (error) {
          console.error('Error loading messages:', error)
        }
      }, 2000)
      return () => clearInterval(interval)
    }

    // Subscribe to realtime changes for chat_messages table
    const channel = supabase
      .channel(`chat:${tourId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chat_messages',
          filter: `tour_id=eq.${tourId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          // Reload messages when changes occur
          try {
            const tourMessages = await dataRepository.getMessagesByTourId(tourId)
            setMessages(tourMessages)
          } catch (error) {
            console.error('Error reloading messages:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tourId])

  useEffect(() => {
    // Only scroll on initial load or when new messages arrive (not on every message change)
    if (!isInitialLoad.current) {
      scrollToBottom()
    }
  }, [messages])

  useEffect(() => {
    // Scroll to bottom after initial load completes
    if (!isLoading && isInitialLoad.current) {
      setTimeout(() => {
        scrollToBottom()
        isInitialLoad.current = false
      }, 100)
    }
  }, [isLoading])

  const scrollToBottom = () => {
    // Scroll within the ScrollArea viewport, not the entire page
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        })
      }
    } else {
      // Fallback: use scrollIntoView with block: 'nearest' to prevent page scrolling
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await dataRepository.addMessage({
        tourId,
        userId,
        message: newMessage.trim(),
      })
      setNewMessage('')
      // Messages will be updated via Realtime subscription
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-96 sm:h-96 max-h-[60vh] sm:max-h-none">
      <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4 px-2">
        <div className="space-y-4 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-3/4 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Noch keine Nachrichten</p>
          ) : (
            <>
              {messages.map((message) => {
                const isOwnMessage = message.userId === userId
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage
                        src={message.user?.profilePhoto || undefined}
                        alt={message.user?.name || 'Benutzer'}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {message.user?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.user && !isOwnMessage && (
                        <p className="text-xs font-semibold mb-0.5 text-primary">
                          {message.user.name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap" style={{ margin: 0 }}>
                        {message.message || '(Keine Nachricht)'}
                      </p>
                      <p
                        className={`text-xs text-right ${
                          isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}
                        style={{ marginTop: '1px', marginBottom: 0 }}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2 items-end touch-manipulation" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1"
          autoComplete="off"
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="touch-target p-3 flex-shrink-0"
          aria-label="Nachricht senden"
        >
          <Send className="w-5 h-5" strokeWidth={2} />
        </Button>
      </form>
    </div>
  )
}

