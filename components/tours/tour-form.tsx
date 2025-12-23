"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, CopyIcon, MapPin, Mountain, Users, FileText } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { tourFormSchema, type TourFormValues } from "@/lib/validations/tour"
import type { Tour as TourCardType } from '@/components/tours/tour-card'
import type { Tour } from '@/lib/types'
import { dataRepository } from '@/lib/data'
import { toast } from 'sonner'

interface TourFormProps {
    mode?: 'create' | 'edit'
    initialData?: Tour
}

// Mock Data
const MOCK_EXISTING_TOURS: Partial<TourCardType>[] = [
    {
        title: "Piz Palü",
        description: "Klassische Hochtour über den Normalweg.",
        ascent: 1200,
        descent: 1200,
        duration: "5h",
        type: "Skitour",
        difficulty: "ZS",
        guide: "Max Muster",
    },
    {
        title: "Muttseehütte",
        description: "Wanderung zur Muttseehütte via Tierfehd.",
        ascent: 600,
        descent: 600,
        duration: "4h",
        type: "Wanderung",
        difficulty: "T3",
        guide: "Anna Alpin",
    },
]

const MOCK_GUIDES = [
    { id: "1", name: "Pascal Staub", role: "Admin" },
    { id: "2", name: "Max Muster", role: "Tourenleiter" },
    { id: "3", name: "Anna Alpin", role: "Tourenleiter" },
    { id: "4", name: "Felix Fels", role: "Tourenleiter" },
]

export function TourForm({ mode = 'create', initialData }: TourFormProps) {
    const router = useRouter()
    const [duplicateMatch, setDuplicateMatch] = useState<Partial<TourCardType> | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<TourFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(tourFormSchema) as any,
        defaultValues: initialData ? {
            title: initialData.title || "",
            description: initialData.description || "",
            date: new Date(initialData.date),
            ascent: initialData.ascent || 0,
            descent: initialData.descent || 0,
            duration: [3, 5], // Default since duration is now string
            type: initialData.type || "Skitour",
            difficulty: initialData.difficulty || "WS",
            whatsappLink: initialData.whatsappLink || "",
            guide: initialData.leader?.name || "",
        } : {
            title: "",
            description: "",
            ascent: 0,
            descent: 0,
            duration: [3, 5],
            type: "Skitour",
            difficulty: "WS",
            whatsappLink: "",
            guide: "",
        },
    })

    const watchedTitle = useWatch({
        control: form.control,
        name: "title",
    })

    useEffect(() => {
        if (!watchedTitle || watchedTitle.length < 3) {
            setDuplicateMatch(null)
            return
        }
        const match = MOCK_EXISTING_TOURS.find(
            (t) => t.title?.toLowerCase() === watchedTitle.toLowerCase()
        )
        setDuplicateMatch(match || null)
    }, [watchedTitle])

    const applyDuplicate = () => {
        if (!duplicateMatch) return
        form.setValue("description", duplicateMatch.description || "")
        form.setValue("ascent", duplicateMatch.ascent || 0)
        form.setValue("descent", duplicateMatch.descent || 0)
        form.setValue("type", duplicateMatch.type || "Skitour")
        form.setValue("difficulty", duplicateMatch.difficulty || "WS")
        form.setValue("guide", duplicateMatch.guide || "")
        setDuplicateMatch(null)
    }

    async function onSubmit(data: TourFormValues) {
        setIsSubmitting(true)
        try {
            if (mode === 'edit' && initialData) {
                // Update existing tour
                await dataRepository.updateTour(initialData.id, {
                    title: data.title,
                    description: data.description || '',
                    date: data.date?.toISOString().split('T')[0] || '',
                    type: data.type,
                    difficulty: data.difficulty,
                    ascent: data.ascent || 0,
                    duration: data.duration ? `${data.duration[0]}-${data.duration[1]} Stunden` : '4 Stunden',
                    whatsappLink: data.whatsappLink || undefined,
                })
                toast.success('Tour erfolgreich aktualisiert')
                router.push(`/tours/${initialData.id}`)
            } else {
                // Create new tour
                console.log('Creating tour:', data)
                toast.success('Tour erfolgreich erstellt')
                router.push('/tours')
            }
        } catch (error) {
            console.error('Error saving tour:', error)
            toast.error('Fehler beim Speichern der Tour')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Duplicate Alert */}
                {duplicateMatch && (
                    <Alert className="border-primary/50 bg-primary/10">
                        <CopyIcon className="h-4 w-4 text-primary" />
                        <AlertTitle>Ähnliche Tour gefunden</AlertTitle>
                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                            <span className="text-muted-foreground">
                                Eine Tour mit dem Namen <strong className="text-foreground">{duplicateMatch.title}</strong> existiert bereits.
                            </span>
                            <Button size="sm" variant="outline" type="button" onClick={applyDuplicate}>
                                Daten übernehmen
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Section 1: Allgemein */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Allgemeine Informationen</CardTitle>
                                <CardDescription>Name, Datum und Beschreibung der Tour.</CardDescription>
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
                                            <Input placeholder="z.B. Piz Palü" {...field} />
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
                                <CardDescription>Art, Schwierigkeit und Höhenmeter.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Art</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Art wählen" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Skitour">Skitour</SelectItem>
                                                <SelectItem value="Hochtour">Hochtour</SelectItem>
                                                <SelectItem value="Wanderung">Wanderung</SelectItem>
                                                <SelectItem value="Klettern">Klettern</SelectItem>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Schwierigkeit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="L">Leicht (L)</SelectItem>
                                                <SelectItem value="WS">Wenig Schwierig (WS)</SelectItem>
                                                <SelectItem value="ZS">Ziemlich Schwierig (ZS)</SelectItem>
                                                <SelectItem value="S">Schwierig (S)</SelectItem>
                                                <SelectItem value="SS">Sehr Schwierig (SS)</SelectItem>
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
                                <CardDescription>Tourenleiter und Kommunikation.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="guide"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tourenleiter</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Leiter wählen" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MOCK_GUIDES.map((guide) => (
                                                    <SelectItem key={guide.id} value={guide.name}>
                                                        {guide.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
