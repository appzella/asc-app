'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChatMessage } from '@/lib/types'
import { dataRepository } from '@/lib/data'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const STORAGE_KEY_PREFIX = 'chat_last_read_'

/**
 * Speichert den Timestamp der letzten gelesenen Nachricht für eine Tour
 */
export function markTourAsRead(tourId: string, timestamp: Date | string) {
  if (typeof window === 'undefined') return
  
  const timestampStr = timestamp instanceof Date ? timestamp.toISOString() : timestamp
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${tourId}`, timestampStr)
}

/**
 * Ruft den Timestamp der letzten gelesenen Nachricht für eine Tour ab
 */
export function getLastReadTimestamp(tourId: string): Date | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tourId}`)
  if (!stored) return null
  
  try {
    return new Date(stored)
  } catch {
    return null
  }
}

/**
 * Berechnet die Anzahl ungelesener Nachrichten für eine Tour
 */
export function getUnreadCount(messages: ChatMessage[], tourId: string): number {
  if (messages.length === 0) return 0
  
  const lastRead = getLastReadTimestamp(tourId)
  if (!lastRead) {
    // Wenn noch nie gelesen, alle Nachrichten als ungelesen zählen
    return messages.length
  }
  
  // Zähle Nachrichten, die nach dem letzten gelesenen Timestamp erstellt wurden
  return messages.filter(msg => {
    const msgDate = new Date(msg.createdAt)
    return msgDate > lastRead
  }).length
}

/**
 * Hook zum Berechnen ungelesener Nachrichten für eine einzelne Tour
 */
export function useUnreadCount(tourId: string | null, userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Lade Nachrichten für die Tour
  useEffect(() => {
    if (!tourId || !userId) {
      setMessages([])
      setUnreadCount(0)
      return
    }

    const loadMessages = async () => {
      try {
        const tourMessages = await dataRepository.getMessagesByTourId(tourId)
        setMessages(tourMessages)
        const count = getUnreadCount(tourMessages, tourId)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error loading messages for unread count:', error)
      }
    }

    loadMessages()

    // Realtime subscription für neue Nachrichten
    if (!isSupabaseConfigured || !supabase) {
      // Polling fallback
      const interval = setInterval(loadMessages, 5000)
      return () => clearInterval(interval)
    }

    const channel = supabase
      .channel(`unread_count:${tourId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `tour_id=eq.${tourId}`,
        },
        async () => {
          // Reload messages when changes occur
          await loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tourId, userId])

  // Markiere als gelesen, wenn der Chat geöffnet wird (optional - kann auch manuell aufgerufen werden)
  const markAsRead = useCallback(() => {
    if (!tourId || messages.length === 0) return
    
    // Finde die neueste Nachricht
    const newestMessage = messages.reduce((latest, msg) => {
      const msgDate = new Date(msg.createdAt)
      const latestDate = new Date(latest.createdAt)
      return msgDate > latestDate ? msg : latest
    }, messages[0])
    
    markTourAsRead(tourId, newestMessage.createdAt)
    setUnreadCount(0)
  }, [tourId, messages])

  return { unreadCount, markAsRead }
}

/**
 * Hook zum Berechnen der Gesamtanzahl ungelesener Nachrichten über alle Touren
 */
export function useTotalUnreadCount(userId: string | null) {
  const [totalUnread, setTotalUnread] = useState(0)
  const [tours, setTours] = useState<{ id: string }[]>([])

  // Lade alle Touren, bei denen der User angemeldet ist
  useEffect(() => {
    if (!userId) {
      setTotalUnread(0)
      setTours([])
      return () => {
        // Cleanup - immer eine Funktion zurückgeben
      }
    }

    const loadToursAndCount = async () => {
      try {
        const allTours = await dataRepository.getTours()
        // Filtere Touren, bei denen der User angemeldet ist
        const userTours = allTours.filter(tour => 
          tour.participants.includes(userId) || tour.leaderId === userId
        )
        setTours(userTours.map(t => ({ id: t.id })))

        // Berechne unread count für jede Tour
        let total = 0
        for (const tour of userTours) {
          try {
            const messages = await dataRepository.getMessagesByTourId(tour.id)
            const count = getUnreadCount(messages, tour.id)
            total += count
          } catch (error) {
            console.error(`Error loading messages for tour ${tour.id}:`, error)
          }
        }
        setTotalUnread(total)
      } catch (error) {
        console.error('Error loading tours for unread count:', error)
      }
    }

    loadToursAndCount()

    let cleanup: (() => void) | undefined

    // Realtime subscription für alle relevanten Touren
    if (!isSupabaseConfigured || !supabase) {
      // Polling fallback - häufiger updaten für bessere Live-Updates
      const interval = setInterval(loadToursAndCount, 5000)
      cleanup = () => clearInterval(interval)
    } else {
      // Subscribe zu allen Chat-Messages - wird bei jeder neuen Nachricht getriggert
      // Filter wird in loadToursAndCount gemacht (nur relevante Touren)
      const channel = supabase
        .channel(`total_unread:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'chat_messages',
          },
          async (payload) => {
            // Nur neu laden, wenn es eine INSERT oder UPDATE ist
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              await loadToursAndCount()
            }
          }
        )
        .subscribe()

      cleanup = () => {
        supabase.removeChannel(channel)
      }
    }

    return cleanup || (() => {
      // Fallback cleanup
    })
  }, [userId])

  return totalUnread
}

