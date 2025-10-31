'use client'

import { useEffect, useState, useRef } from 'react'
import { dataRepository } from '@/lib/data'
import { ChatMessage } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface ChatWindowProps {
  tourId: string
  userId: string
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ tourId, userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const tourMessages = await dataRepository.getMessagesByTourId(tourId)
        setMessages(tourMessages)
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setIsLoading(false)
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
        async (payload) => {
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
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 overscroll-contain">
        {isLoading ? (
          <p className="text-center text-gray-500 text-sm">Lade Nachrichten...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">Noch keine Nachrichten</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
                  message.userId === userId
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.user && message.userId !== userId && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.user.name}
                  </p>
                )}
                <p className="text-sm">{message.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.userId === userId ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 items-end touch-manipulation" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit" disabled={!newMessage.trim()} className="touch-target">
          Senden
        </Button>
      </form>
    </div>
  )
}

