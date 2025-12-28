"use client"

import { useEffect, useState, useCallback } from "react"
import { BellIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { dataRepository } from "@/lib/data"
import { authService } from "@/lib/auth"
import { Notification } from "@/lib/types"

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "gerade eben"
    if (diffMins < 60) return `vor ${diffMins} Min.`
    if (diffHours < 24) return `vor ${diffHours} Std.`
    if (diffDays === 1) return "gestern"
    return `vor ${diffDays} Tagen`
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    const loadNotifications = useCallback(async () => {
        const user = authService.getCurrentUser()
        if (!user) return

        const data = await dataRepository.getNotifications(user.id)
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
        setIsLoading(false)
    }, [])

    useEffect(() => {
        loadNotifications()

        // Refresh every 30 seconds
        const interval = setInterval(loadNotifications, 30000)
        return () => clearInterval(interval)
    }, [loadNotifications])

    const handleMarkAllRead = async () => {
        const user = authService.getCurrentUser()
        if (!user) return

        await dataRepository.markAllNotificationsAsRead(user.id)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await dataRepository.markNotificationAsRead(notification.id)
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Benachrichtigungen</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4">
                    <h4 className="font-semibold leading-none">Benachrichtigungen</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs"
                            onClick={handleMarkAllRead}
                        >
                            Alle gelesen
                        </Button>
                    )}
                </div>
                <Separator />
                <ScrollArea className="h-[300px]">
                    <div className="grid gap-1 p-1">
                        {isLoading ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Lädt...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                Keine Benachrichtigungen
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                notification.link ? (
                                    <Link
                                        key={notification.id}
                                        href={notification.link}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent ${!notification.read ? "bg-accent/50" : ""}`}
                                    >
                                        <NotificationContent notification={notification} />
                                    </Link>
                                ) : (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent cursor-pointer ${!notification.read ? "bg-accent/50" : ""}`}
                                    >
                                        <NotificationContent notification={notification} />
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

function NotificationContent({ notification }: { notification: Notification }) {
    return (
        <div className="grid gap-1 flex-1">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{notification.title}</span>
                {!notification.read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                {notification.message}
            </p>
            <p className="text-[10px] text-muted-foreground">
                {formatTimeAgo(notification.createdAt)}
            </p>
        </div>
    )
}
