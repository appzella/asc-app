'use client'

import { useState } from 'react'
import { NotificationPreferences } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Default empty preferences
const defaultPreferences: NotificationPreferences = {
    userId: '',
    emailNewTour: true,
    pushNewTour: true,
    emailParticipantSignup: true,
    pushParticipantSignup: true,
    emailTourUpdate: true,
    pushTourUpdate: true,
    createdAt: new Date(),
    updatedAt: new Date()
}

export function NotificationSettings() {
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Mock logic: Load nothing, save nothing (or save to local state)

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key as keyof NotificationPreferences]
        }))
    }

    const savePreferences = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsSaving(false)
        toast.success("Einstellungen gespeichert (Mock)")
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Benachrichtigungen</CardTitle>
                <CardDescription>
                    Steuere, wie und worüber du benachrichtigt werden möchtest.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Neue Touren</h3>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email-new-tour" className="flex flex-col space-y-1">
                            <span>E-Mail Benachrichtigungen</span>
                            <span className="font-normal text-xs text-muted-foreground">Erhalte eine E-Mail, wenn neue Touren ausgeschrieben werden.</span>
                        </Label>
                        <Switch
                            id="email-new-tour"
                            checked={preferences.emailNewTour}
                            onCheckedChange={() => handleToggle('emailNewTour')}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={savePreferences} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Speichern
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
