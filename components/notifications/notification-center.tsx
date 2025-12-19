'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Notification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

export function NotificationCenter() {
    // Mock state for migration
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    // No-op for now
    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="relative rounded-full w-8 h-8 bg-background group">
                                <Bell className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:animate-shake" />
                                {unreadCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] rounded-full"
                                    >
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Benachrichtigungen</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Benachrichtigungen</SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto py-1 px-2"
                                onClick={markAllAsRead}
                            >
                                Alle als gelesen markieren
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <ScrollArea className="flex-1">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">Keine Benachrichtigungen</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group flex gap-4",
                                        !notification.read ? "bg-muted/30" : "bg-background"
                                    )}
                                >
                                    <div className="mt-1">
                                        {!notification.read ? (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        ) : (
                                            <div className="w-2 h-2" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: de })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {notification.message}
                                        </p>
                                        {notification.link && (
                                            <Link
                                                href={notification.link}
                                                className="text-xs text-primary hover:underline block mt-2 font-medium"
                                                onClick={() => {
                                                    if (!notification.read) markAsRead(notification.id)
                                                    setIsOpen(false)
                                                }}
                                            >
                                                Details ansehen
                                            </Link>
                                        )}
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => markAsRead(notification.id)}
                                            title="Als gelesen markieren"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
