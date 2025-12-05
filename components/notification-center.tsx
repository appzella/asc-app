"use client"

import { BellIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const notifications = [
    {
        id: "1",
        title: "Neue Tour erstellt",
        description: "Max Mustermann hat 'Säntis Runde' erstellt.",
        time: "vor 5 Min.",
        read: false,
    },
    {
        id: "2",
        title: "Mitglied beigetreten",
        description: "Anna Müller ist dem Verein beigetreten.",
        time: "vor 1 Std.",
        read: false,
    },
    {
        id: "3",
        title: "Tour Update",
        description: "Die Tour 'Bodensee' wurde aktualisiert.",
        time: "vor 2 Std.",
        read: true,
    },
]

export function NotificationCenter() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    <span className="sr-only">Benachrichtigungen</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4">
                    <h4 className="font-semibold leading-none">Benachrichtigungen</h4>
                    <Button variant="ghost" size="sm" className="h-auto px-2 text-xs">
                        Alle gelesen
                    </Button>
                </div>
                <Separator />
                <ScrollArea className="h-[300px]">
                    <div className="grid gap-1 p-1">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent ${!notification.read ? "bg-accent/50" : ""
                                    }`}
                            >
                                <div className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{notification.title}</span>
                                        {!notification.read && (
                                            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {notification.description}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {notification.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
