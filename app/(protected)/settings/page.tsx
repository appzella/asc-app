'use client'

import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Bell, Palette } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { updateUserSettings, getUserSettings } from "@/app/actions/settings"

interface NotificationSettings {
    emailNotifications: boolean
    pushNotifications: boolean
}

const defaultSettings: NotificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
    const [isSaving, setIsSaving] = useState(false)

    // Load settings from database on mount
    useEffect(() => {
        setMounted(true)
        const loadSettings = async () => {
            try {
                const dbSettings = await getUserSettings()
                if (dbSettings) {
                    setSettings({
                        emailNotifications: dbSettings.emailNotifications ?? true,
                        pushNotifications: dbSettings.pushNotifications ?? true,
                    })
                    // Sync theme from database if different
                    if (dbSettings.theme && dbSettings.theme !== theme) {
                        setTheme(dbSettings.theme)
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            }
        }
        loadSettings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Save theme to database
    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme)
        setIsSaving(true)
        try {
            const result = await updateUserSettings({ theme: newTheme as 'light' | 'dark' | 'system' })
            if (result.success) {
                toast.success('Thema gespeichert')
            } else {
                toast.error(result.error || 'Fehler beim Speichern')
            }
        } catch (error) {
            console.error('Error saving theme:', error)
            toast.error('Fehler beim Speichern')
        } finally {
            setIsSaving(false)
        }
    }

    // Save notification setting to database
    const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        setIsSaving(true)

        try {
            const result = await updateUserSettings({ [key]: value })
            if (result.success) {
                toast.success('Einstellung gespeichert')
            } else {
                // Revert on error
                setSettings(settings)
                toast.error(result.error || 'Fehler beim Speichern')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            setSettings(settings)
            toast.error('Fehler beim Speichern')
        } finally {
            setIsSaving(false)
        }
    }

    if (!mounted) {
        return (
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex flex-col gap-1 px-4 lg:px-6">
                    <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
                    <p className="text-muted-foreground">Verwalte deine App-Einstellungen.</p>
                </div>
                <div className="px-4 lg:px-6 space-y-4 max-w-2xl">
                    <Skeleton className="h-[150px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
                <p className="text-muted-foreground">Verwalte deine App-Einstellungen.</p>
            </div>

            <div className="px-4 lg:px-6 space-y-4 max-w-2xl">
                {/* Theme Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Palette className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Darstellung</CardTitle>
                                <CardDescription>Passe das Erscheinungsbild der App an.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="theme">Thema</Label>
                                <p className="text-sm text-muted-foreground">Wähle zwischen hellem und dunklem Modus.</p>
                            </div>
                            <Select value={theme} onValueChange={handleThemeChange} disabled={isSaving}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Wähle ein Thema" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Hell</SelectItem>
                                    <SelectItem value="dark">Dunkel</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Benachrichtigungen</CardTitle>
                                <CardDescription>Steuere, wie wir dich kontaktieren dürfen.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-notifications">E-Mail Benachrichtigungen</Label>
                                <p className="text-sm text-muted-foreground">Erhalte E-Mails über neue Touren.</p>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="push-notifications">Push-Benachrichtigungen</Label>
                                <p className="text-sm text-muted-foreground">Erhalte Push-Meldungen auf dein Gerät.</p>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={settings.pushNotifications}
                                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                                disabled={isSaving}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
