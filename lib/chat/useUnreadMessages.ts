'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { dataRepository } from '@/lib/data'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Normalisiert tourId und userId zu Strings (für Filter und Queries)
 */
function normalizeIds(tourId: unknown, userId: unknown): { tourId: string; userId: string } | null {
  let tourIdStr: string
  let userIdStr: string

  if (Array.isArray(tourId)) {
    tourIdStr = String(tourId[0])
  } else if (typeof tourId === 'object' && tourId !== null) {
    tourIdStr = String((tourId as { id?: string }).id || tourId)
  } else {
    tourIdStr = String(tourId)
  }

  if (Array.isArray(userId)) {
    userIdStr = String(userId[0])
  } else if (typeof userId === 'object' && userId !== null) {
    userIdStr = String((userId as { id?: string }).id || userId)
  } else {
    userIdStr = String(userId)
  }

  if (!tourIdStr || !userIdStr || tourIdStr === 'undefined' || userIdStr === 'undefined') {
    return null
  }

  return { tourId: tourIdStr, userId: userIdStr }
}

/**
 * Markiert eine Tour als gelesen (speichert in Datenbank)
 * Aktualisiert auch den Cache sofort für optimistische Updates
 */
export async function markTourAsRead(tourId: string, userId: string, timestamp: Date | string): Promise<boolean> {
  if (!userId || !tourId) return false
  
  const normalized = normalizeIds(tourId, userId)
  if (!normalized) return false

  // Optimistisches Update: Setze Cache sofort auf 0
  setUnreadCountCache(normalized.tourId, normalized.userId, 0)
  
  // Speichere in Datenbank (im Hintergrund)
  try {
    return await dataRepository.markTourAsRead(normalized.tourId, normalized.userId, timestamp)
  } catch (error) {
    // Bei Fehler: Entferne aus Cache
    globalUnreadCountCache.delete(`${normalized.tourId}:${normalized.userId}`)
    return false
  }
}

/**
 * Ruft den Timestamp der letzten gelesenen Nachricht für eine Tour ab (aus Datenbank)
 */
export async function getLastReadTimestamp(tourId: string, userId: string): Promise<Date | null> {
  if (!userId || !tourId) return null
  
  const normalized = normalizeIds(tourId, userId)
  if (!normalized) return null

  return await dataRepository.getLastReadTimestamp(normalized.tourId, normalized.userId)
}

/**
 * Berechnet die Anzahl ungelesener Nachrichten für eine Tour (aus Datenbank)
 */
export async function getUnreadCount(tourId: string, userId: string): Promise<number> {
  if (!userId || !tourId) return 0
  
  const normalized = normalizeIds(tourId, userId)
  if (!normalized) return 0

  try {
    return await dataRepository.getUnreadCount(normalized.tourId, normalized.userId)
  } catch (error) {
    return 0
  }
}

/**
 * Hook zum Berechnen ungelesener Nachrichten für eine einzelne Tour
 * Mit Live-Updates via Realtime
 */
export function useUnreadCount(tourId: string | null, userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const loadUnreadCountRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (!tourId || !userId) {
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    const normalized = normalizeIds(tourId, userId)
    if (!normalized) {
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    const loadUnreadCount = useCallback(async () => {
      try {
        const count = await getUnreadCount(normalized.tourId, normalized.userId)
        setUnreadCount(count)
        setUnreadCountCache(normalized.tourId, normalized.userId, count)
      } catch (error) {
        setUnreadCount(0)
        setUnreadCountCache(normalized.tourId, normalized.userId, 0)
      } finally {
        setIsLoading(false)
      }
    }, [normalized.tourId, normalized.userId])

    loadUnreadCountRef.current = loadUnreadCount
    loadUnreadCount()

    // Realtime subscription für neue Nachrichten und Read-Status Updates
    if (!isSupabaseConfigured || !supabase) {
      const interval = setInterval(loadUnreadCount, 5000)
      return () => clearInterval(interval)
    }

    // Subscribe zu chat_messages Änderungen
    const messagesChannel = supabase
      .channel(`unread_messages:${normalized.tourId}:${normalized.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `tour_id=eq.${normalized.tourId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            await loadUnreadCount()
          }
        }
      )
      .subscribe()

    // Subscribe zu chat_read_messages Änderungen
    const readChannel = supabase
      .channel(`read_status:${normalized.tourId}:${normalized.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_read_messages',
          filter: `tour_id=eq.${normalized.tourId} AND user_id=eq.${normalized.userId}`,
        },
        async () => {
          await loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(readChannel)
    }
  }, [tourId, userId])

  // Markiere als gelesen (mit optimistischem Update)
  const markAsRead = useCallback(async () => {
    if (!tourId || !userId) return

    const normalized = normalizeIds(tourId, userId)
    if (!normalized) return

    // Optimistisches Update: Setze sofort auf 0
    setUnreadCount(0)
    setUnreadCountCache(normalized.tourId, normalized.userId, 0)

    try {
      const messages = await dataRepository.getMessagesByTourId(normalized.tourId)
      if (messages.length === 0) return

      const newestMessage = messages.reduce((latest, msg) => {
        const msgDate = new Date(msg.createdAt)
        const latestDate = new Date(latest.createdAt)
        return msgDate > latestDate ? msg : latest
      }, messages[0])

      // Markiere in Datenbank (im Hintergrund)
      markTourAsRead(normalized.tourId, normalized.userId, newestMessage.createdAt).catch(() => {
        if (loadUnreadCountRef.current) {
          loadUnreadCountRef.current()
        }
      })
    } catch {
      if (loadUnreadCountRef.current) {
        loadUnreadCountRef.current()
      }
    }
  }, [tourId, userId])

  return { unreadCount, markAsRead, isLoading }
}

// Globaler Cache für optimistische Updates
const globalUnreadCountCache = new Map<string, number>()

// Expose für andere Module (z.B. Chat-Seite)
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__unreadCountCache = globalUnreadCountCache
}

// Event-Listener für sofortige UI-Updates
type CacheUpdateListener = (tourId: string, userId: string, count: number) => void
const cacheUpdateListeners = new Set<CacheUpdateListener>()

/**
 * Setzt einen unread count für eine Tour im Cache (für optimistische Updates)
 * Triggert auch alle Event-Listener für sofortige UI-Updates
 */
export function setUnreadCountCache(tourId: string, userId: string, count: number): void {
  const key = `${tourId}:${userId}`
  globalUnreadCountCache.set(key, count)
  cacheUpdateListeners.forEach(listener => listener(tourId, userId, count))
}

// Debounce-Helper für Realtime-Updates
let debounceTimers = new Map<string, NodeJS.Timeout>()

function debounce(key: string, fn: () => void, delay: number = 300): void {
  const existing = debounceTimers.get(key)
  if (existing) {
    clearTimeout(existing)
  }
  const timer = setTimeout(() => {
    fn()
    debounceTimers.delete(key)
  }, delay)
  debounceTimers.set(key, timer)
}

/**
 * Hook zum Berechnen der Gesamtanzahl ungelesener Nachrichten über alle Touren
 * Mit Live-Updates via Realtime
 */
export function useTotalUnreadCount(userId: string | null): number {
  const [totalUnread, setTotalUnread] = useState(0)
  const [tours, setTours] = useState<{ id: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const toursRef = useRef<{ id: string }[]>([])

  useEffect(() => {
    if (!userId) {
      setTotalUnread(0)
      setTours([])
      setIsLoading(false)
      return
    }

    const normalized = normalizeIds(userId, userId)
    if (!normalized) {
      setTotalUnread(0)
      setTours([])
      setIsLoading(false)
      return
    }

    const loadToursAndCount = async () => {
      try {
        setIsLoading(true)
        const allTours = await dataRepository.getTours()
        const userTours = allTours.filter(
          tour => tour.participants.includes(normalized.userId) || tour.leaderId === normalized.userId
        )
        const toursList = userTours.map(t => ({ id: t.id }))
        setTours(toursList)
        toursRef.current = toursList

        // Berechne unread count für jede Tour
        const countPromises = userTours.map(async (tour) => {
          try {
            const cacheKey = `${tour.id}:${normalized.userId}`
            const cachedCount = globalUnreadCountCache.get(cacheKey)
            if (cachedCount !== undefined) {
              return cachedCount
            }
            const count = await getUnreadCount(tour.id, normalized.userId)
            globalUnreadCountCache.set(cacheKey, count)
            return count
          } catch {
            return 0
          }
        })

        const counts = await Promise.all(countPromises)
        const total = counts.reduce((sum, count) => sum + count, 0)
        setTotalUnread(total)
      } catch {
        setTotalUnread(0)
      } finally {
        setIsLoading(false)
      }
    }

    // Event-Listener für sofortige Cache-Updates
    const handleCacheUpdate = (updatedTourId: string, updatedUserId: string, count: number) => {
      if (updatedUserId !== normalized.userId) return
      const currentTours = toursRef.current
      const isRelevantTour = currentTours.some(t => t.id === updatedTourId)
      if (isRelevantTour) {
        const currentTotal = currentTours.reduce((sum, tour) => {
          const cacheKey = `${tour.id}:${normalized.userId}`
          const cachedCount = globalUnreadCountCache.get(cacheKey)
          return sum + (cachedCount !== undefined ? cachedCount : 0)
        }, 0)
        setTotalUnread(Math.max(0, currentTotal))
      }
    }

    cacheUpdateListeners.add(handleCacheUpdate)
    loadToursAndCount()

    // Realtime subscription
    if (!isSupabaseConfigured || !supabase) {
      const interval = setInterval(loadToursAndCount, 5000)
      return () => {
        clearInterval(interval)
        cacheUpdateListeners.delete(handleCacheUpdate)
      }
    }

    // Subscribe zu Chat-Messages
    const messagesChannel = supabase
      .channel(`total_unread_messages:${normalized.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            debounce(`messages:${normalized.userId}`, loadToursAndCount)
          }
        }
      )
      .subscribe()

    // Subscribe zu Read-Status Updates
    const readChannel = supabase
      .channel(`total_read_status:${normalized.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_read_messages',
          filter: `user_id=eq.${normalized.userId}`,
        },
        async (_payload: RealtimePostgresChangesPayload<any>) => {
          debounce(`read:${normalized.userId}`, loadToursAndCount)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(readChannel)
      cacheUpdateListeners.delete(handleCacheUpdate)
    }
  }, [userId])

  return totalUnread
}
