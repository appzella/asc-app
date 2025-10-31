'use client'

import { useEffect, useState, useRef } from 'react'
import { dataStore } from '@/lib/data/mockData'
import { ChatMessage } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ChatWindowProps {
  tourId: string
  userId: string
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ tourId, userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMessages = () => {
      const tourMessages = dataStore.getMessagesByTourId(tourId)
      setMessages(tourMessages)
    }

    loadMessages()
    
    // Simuliere Echtzeit-Updates (alle 2 Sekunden)
    const interval = setInterval(loadMessages, 2000)
    
    return () => clearInterval(interval)
  }, [tourId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    dataStore.addMessage({
      tourId,
      userId,
      message: newMessage.trim(),
    })

    const updatedMessages = dataStore.getMessagesByTourId(tourId)
    setMessages(updatedMessages)
    setNewMessage('')
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">Noch keine Nachrichten</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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

      <form onSubmit={handleSend} className="flex gap-2 items-end">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newMessage.trim()}>
          Senden
        </Button>
      </form>
    </div>
  )
}

