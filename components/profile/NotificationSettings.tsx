'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { NotificationPreferences } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { urlBase64ToUint8Array } from '@/lib/utils'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string

export function NotificationSettings() {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPreferences()
    }, [])

    const fetchPreferences = async () => {
        if (!supabase) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // No preferences found, create default
                    setPreferences({
                        userId: user.id,
                        emailNewTour: true,
                        pushNewTour: true,
                        emailParticipantSignup: true,
                        pushParticipantSignup: true,
                        emailTourUpdate: true,
                        pushTourUpdate: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                } else {
                    console.error('Error fetching preferences:', error)
                }
            }

            if (data) {
                // Map snake_case to camelCase
                setPreferences({
                    userId: data.user_id,
                    emailNewTour: data.email_new_tour,
                    pushNewTour: data.push_new_tour,
                    emailParticipantSignup: data.email_participant_signup,
                    pushParticipantSignup: data.push_participant_signup,
                    emailTourUpdate: data.email_tour_update,
                    pushTourUpdate: data.push_tour_update,
                    createdAt: new Date(data.created_at),
                    updatedAt: new Date(data.updated_at),
                })
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast.error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt.')
            return false
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js')

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription()

            if (!subscription) {
                const permission = await Notification.requestPermission()
                if (permission !== 'granted') {
                    toast.error('Benachrichtigungsberechtigung wurde verweigert.')
                    return false
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })
            }

            // Save subscription to DB
            if (supabase && preferences) {
                const { error } = await supabase
                    .from('push_subscriptions')
                    .upsert({
                        user_id: preferences.userId,
                        endpoint: subscription.endpoint,
                        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
                        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!)))),
                    }, { onConflict: 'endpoint' })

                if (error) {
                    console.error('Error saving subscription:', error.message, error.details, error.hint)
                }
            }

            return true
        } catch (error) {
            console.error('Error subscribing to push:', error)
            toast.error('Fehler bei der Aktivierung von Push-Benachrichtigungen.')
            return false
        }
    }

    const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!supabase || !preferences) return

        // If enabling a push setting, ensure we have a subscription
        if (value && key.toString().startsWith('push')) {
            const success = await subscribeToPush()
            if (!success) {
                // Don't update state if subscription failed
                return
            }
        }

        // Optimistic update
        const oldPreferences = { ...preferences }
        setPreferences({ ...preferences, [key]: value })

        // Map camelCase key back to snake_case for DB
        const dbKeyMap: Record<string, string> = {
            emailNewTour: 'email_new_tour',
            pushNewTour: 'push_new_tour',
            emailParticipantSignup: 'email_participant_signup',
            pushParticipantSignup: 'push_participant_signup',
            emailTourUpdate: 'email_tour_update',
            pushTourUpdate: 'push_tour_update',
        }

        const dbKey = dbKeyMap[key as string]
        if (!dbKey) return

        // Use upsert to handle missing row
        const { error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: preferences.userId,
                [dbKey]: value
            }, { onConflict: 'user_id' })

        if (error) {
            toast.error('Fehler beim Speichern der Einstellungen')
            setPreferences(oldPreferences) // Revert
        } else {
            toast.success('Einstellungen gespeichert')
        }
    }

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
    }

    if (!preferences) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Benachrichtigungen</CardTitle>
                    <CardDescription>Keine Einstellungen gefunden.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Benachrichtigungen</CardTitle>
                <CardDescription>Steuern Sie, welche Benachrichtigungen Sie erhalten möchten.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Neue Touren</h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-new-tour" className="flex flex-col gap-1">
                            <span>E-Mail</span>
                            <span className="font-normal text-xs text-muted-foreground">Benachrichtigung per E-Mail bei neuen Touren</span>
                        </Label>
                        <Switch
                            id="email-new-tour"
                            checked={preferences.emailNewTour}
                            onCheckedChange={(checked) => updatePreference('emailNewTour', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-new-tour" className="flex flex-col gap-1">
                            <span>Push-Benachrichtigung</span>
                            <span className="font-normal text-xs text-muted-foreground">Push-Benachrichtigung bei neuen Touren</span>
                        </Label>
                        <Switch
                            id="push-new-tour"
                            checked={preferences.pushNewTour}
                            onCheckedChange={(checked) => updatePreference('pushNewTour', checked)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Anmeldungen (für Tourenleiter)</h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-signup" className="flex flex-col gap-1">
                            <span>E-Mail</span>
                            <span className="font-normal text-xs text-muted-foreground">Wenn sich jemand für Ihre Tour anmeldet</span>
                        </Label>
                        <Switch
                            id="email-signup"
                            checked={preferences.emailParticipantSignup}
                            onCheckedChange={(checked) => updatePreference('emailParticipantSignup', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-signup" className="flex flex-col gap-1">
                            <span>Push-Benachrichtigung</span>
                            <span className="font-normal text-xs text-muted-foreground">Wenn sich jemand für Ihre Tour anmeldet</span>
                        </Label>
                        <Switch
                            id="push-signup"
                            checked={preferences.pushParticipantSignup}
                            onCheckedChange={(checked) => updatePreference('pushParticipantSignup', checked)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Touren-Updates</h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-update" className="flex flex-col gap-1">
                            <span>E-Mail</span>
                            <span className="font-normal text-xs text-muted-foreground">Bei Änderungen an Touren, für die Sie angemeldet sind</span>
                        </Label>
                        <Switch
                            id="email-update"
                            checked={preferences.emailTourUpdate}
                            onCheckedChange={(checked) => updatePreference('emailTourUpdate', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-update" className="flex flex-col gap-1">
                            <span>Push-Benachrichtigung</span>
                            <span className="font-normal text-xs text-muted-foreground">Bei Änderungen an Touren, für die Sie angemeldet sind</span>
                        </Label>
                        <Switch
                            id="push-update"
                            checked={preferences.pushTourUpdate}
                            onCheckedChange={(checked) => updatePreference('pushTourUpdate', checked)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
