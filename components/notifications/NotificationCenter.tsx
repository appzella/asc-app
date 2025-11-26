'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Notification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!supabase) return

        fetchNotifications()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    // Refresh notifications on any change
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchNotifications = async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching notifications:', error)
            return
        }

        // Map Supabase response to Notification type (adjusting property names if needed)
        // Supabase returns snake_case, our type is camelCase? 
        // Wait, my type definition in lib/types.ts used camelCase (userId, createdAt), 
        // but Supabase returns snake_case (user_id, created_at).
        // I should probably update the type definition to match Supabase or map it here.
        // For simplicity and consistency with other parts of the app (if they use camelCase), I'll map it.
        // However, looking at existing code might be better. 
        // Let's assume I need to map it for now based on my type definition.

        const mappedNotifications: Notification[] = data.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            read: n.read,
            createdAt: new Date(n.created_at),
        }))

        setNotifications(mappedNotifications)
        setUnreadCount(mappedNotifications.filter(n => !n.read).length)
    }

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)

        if (error) {
            toast.error('Fehler beim Markieren als gelesen')
            return
        }

        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)

        if (error) {
            toast.error('Fehler beim Markieren als gelesen')
            return
        }

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Benachrichtigungen</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={markAllAsRead}
                        >
                            Alle gelesen
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Keine Benachrichtigungen
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: de })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            {notification.link && (
                                                <Link
                                                    href={notification.link}
                                                    className="text-xs text-primary hover:underline block mt-1"
                                                    onClick={() => {
                                                        if (!notification.read) markAsRead(notification.id)
                                                        setIsOpen(false)
                                                    }}
                                                >
                                                    Ansehen
                                                </Link>
                                            )}
                                        </div>
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
                                                onClick={() => markAsRead(notification.id)}
                                                title="Als gelesen markieren"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
