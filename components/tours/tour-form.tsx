"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, MapPin, Mountain, Users, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDurationRange } from "@/lib/duration"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NumberStepper } from "@/components/ui/number-stepper"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"

import { tourFormSchema, type TourFormValues } from "@/lib/validations/tour"
import type { Tour, TourSettings } from '@/lib/types'
import { dataRepository } from '@/lib/data'
import { authService } from '@/lib/auth'
import { toast } from 'sonner'
import { uploadGpxFile } from '@/app/actions/gpx'

interface TourFormProps {
    mode?: 'create' | 'edit'
    initialData?: Tour
}

export function TourForm({ mode = 'create', initialData }: TourFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [settings, setSettings] = useState<TourSettings | null>(null)

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await dataRepository.getSettings()
                setSettings(data)
            } catch (error) {
                console.error('Error loading settings:', error)
                toast.error('Fehler beim Laden der Einstellungen')
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const form = useForm<TourFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(tourFormSchema) as any,
        defaultValues: initialData ? {
            title: initialData.title || "",
            description: initialData.description || "",
            date: new Date(initialData.date),
            type: initialData.type || "",
            difficulty: initialData.difficulty || "",
            length: initialData.length || "",
            peak: initialData.peak || "",
            peakElevation: initialData.peakElevation || undefined,
            ascent: initialData.ascent || 0,
            descent: initialData.descent || 0,
            duration: [initialData.durationMin || 3, initialData.durationMax || 5],
            maxParticipants: initialData.maxParticipants || 12,
            whatsappLink: initialData.whatsappLink || "",
        } : {
            title: "",
            description: "",
            type: "",
            difficulty: "",
            length: "",
            peak: "",
            peakElevation: undefined,
            ascent: 0,
            descent: 0,
            duration: [3, 5],
            maxParticipants: 12,
            whatsappLink: "",
        },
    })

    // Watch type to update difficulty options
    const watchedType = useWatch({
        control: form.control,
        name: "type",
    })

    // Get difficulties for selected type
    const difficultyOptions = settings?.difficulties?.[watchedType] || []

    async function onSubmit(data: TourFormValues) {
        setIsSubmitting(true)
        try {
            const currentUser = authService.getCurrentUser()
            if (!currentUser) {
                toast.error('Du musst angemeldet sein')
                router.push('/login')
                return
            }

            const tourData = {
                title: data.title,
                description: data.description || '',
                date: data.date?.toISOString().split('T')[0] || '',
                type: data.type,
                difficulty: data.difficulty,
                length: data.length,
                peak: data.peak,
                peakElevation: data.peakElevation,
                ascent: data.ascent || 0,
                descent: data.descent || 0,
                durationMin: data.duration?.[0],
                durationMax: data.duration?.[1],
                maxParticipants: data.maxParticipants,
                whatsappLink: data.whatsappLink || undefined,
                leaderId: currentUser.id,
            }

            let tourId: string

            if (mode === 'edit' && initialData) {
                // Update existing tour
                await dataRepository.updateTour(initialData.id, tourData)
                tourId = initialData.id
            } else {
                // Create new tour
                const newTour = await dataRepository.createTour(tourData)
                tourId = newTour.id
            }

            // Upload GPX file if provided
            if (data.gpx && data.gpx instanceof File) {
                const formData = new FormData()
                formData.append('file', data.gpx)
                formData.append('tourId', tourId)

                const result = await uploadGpxFile(formData)
                if (!result.success) {
                    toast.warning(`GPX-Upload fehlgeschlagen: ${result.error}`)
                }
            }

            toast.success(mode === 'edit' ? 'Tour erfolgreich aktualisiert' : 'Tour erfolgreich erstellt')
            router.push(`/tours/${tourId}`)
        } catch (error) {
            console.error('Error saving tour:', error)
            toast.error('Fehler beim Speichern der Tour')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[150px] w-full" />
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Section 1: Allgemein */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Allgemeine Informationen</CardTitle>
                                <CardDescription>Name, Datum, Gipfel und Beschreibung.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Titel</FormLabel>
                                        <FormControl>
                                            <Input placeholder="z.B. Frühjahrstour Alpstein" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Datum</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: de })
                                                        ) : (
                                                            <span>Datum wählen</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Peak and Elevation */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="peak"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gipfel / Ziel</FormLabel>
                                        <FormControl>
                                            <Input placeholder="z.B. Säntis" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="peakElevation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Höhe (m ü.M.)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="z.B. 2502"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Beschreibung</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Beschreibe die Tour, Route, Treffpunkt..."
                                            className="resize-y min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Section 2: Technische Details */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Mountain className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Technische Details</CardTitle>
                                <CardDescription>Art, Schwierigkeit, Länge und Höhenmeter.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Art</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Art wählen" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {settings?.tourTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="difficulty"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Schwierigkeit</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!watchedType || difficultyOptions.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={watchedType ? "Schwierigkeit" : "Erst Art wählen"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {difficultyOptions.map((diff) => (
                                                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="length"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Länge</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Länge wählen" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {settings?.tourLengths.map((len) => (
                                                    <SelectItem key={len} value={len}>{len}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="ascent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aufstieg (Höhenmeter)</FormLabel>
                                        <FormControl>
                                            <NumberStepper
                                                value={field.value || 0}
                                                onValueChange={field.onChange}
                                                min={0}
                                                step={50}
                                                unit="Hm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="descent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Abstieg (Höhenmeter)</FormLabel>
                                        <FormControl>
                                            <NumberStepper
                                                value={field.value || 0}
                                                onValueChange={field.onChange}
                                                min={0}
                                                step={50}
                                                unit="Hm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Geschätzte Dauer</FormLabel>
                                        <span className="text-sm font-medium">
                                            {formatDurationRange([field.value?.[0] || 0, field.value?.[1] || 0])}
                                        </span>
                                    </div>
                                    <FormControl>
                                        <Slider
                                            defaultValue={[3, 5]}
                                            min={0.5}
                                            max={12}
                                            step={0.5}
                                            minStepsBetweenThumbs={1}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="py-4"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Section 3: Organisation */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Organisation</CardTitle>
                                <CardDescription>Teilnehmer und Kommunikation.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="maxParticipants"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max. Teilnehmer</FormLabel>
                                        <FormControl>
                                            <NumberStepper
                                                value={field.value || 12}
                                                onValueChange={field.onChange}
                                                min={1}
                                                max={50}
                                                step={1}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="whatsappLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp Gruppe</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://chat.whatsapp.com/..." {...field} />
                                        </FormControl>
                                        <FormDescription>Optional</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 4: Dateien */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Dateien</CardTitle>
                                <CardDescription>GPX-Track für die Karte.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="gpx"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>GPX Datei</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".gpx"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                            className="cursor-pointer file:cursor-pointer"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Optional. Erlaubte Formate: .gpx (max. 5MB)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Wird gespeichert...' : mode === 'edit' ? 'Änderungen speichern' : 'Tour erstellen'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
