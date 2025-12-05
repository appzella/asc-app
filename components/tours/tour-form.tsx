"use client"

import { Label } from "@/components/ui/label"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, UploadCloud, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { tourFormSchema, type TourFormValues } from "@/lib/validations/tour"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import { useState, useEffect } from "react"
import type { Tour } from '@/components/tours/tour-card'

// Mock Data for Duplication Check
const MOCK_EXISTING_TOURS: Partial<Tour>[] = [
    {
        title: "Piz Palü",
        description: "Klassische Hochtour über den Normalweg.",
        ascent: 1200,
        descent: 1200,
        duration: "5h", // Will need parsing for form, or form uses string for now
        type: "Skitour",
        difficulty: "ZS",
        guide: "Max Muster",
    },
    {
        title: "Muttseehütte",
        description: "Wanderung zur Muttseehütte via Tierfehd.",
        ascent: 600,
        descent: 600,
        type: "Wanderung",
        difficulty: "T3",
        guide: "Anna Alpin",
    },
]

export function TourForm() {
    const [duplicateMatch, setDuplicateMatch] = useState<Partial<Tour> | null>(null)

    const form = useForm<TourFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(tourFormSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            ascent: 0,
            descent: 0,
            duration: [3, 5],
            type: "Skitour",
            difficulty: "WS",
            whatsappLink: "",
            guide: "", // User would be default here
        },
    })

    // Watch Title for Duplication Logic
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

        // Map fields. Note: Duration format handling would be needed in real app
        form.setValue("description", duplicateMatch.description || "")
        form.setValue("ascent", duplicateMatch.ascent || 0)
        form.setValue("descent", duplicateMatch.descent || 0)
        form.setValue("type", duplicateMatch.type || "Skitour")
        form.setValue("difficulty", duplicateMatch.difficulty || "WS")
        form.setValue("guide", duplicateMatch.guide || "")

        // Optional: Toast or feedback
        setDuplicateMatch(null) // Hide alert after applying
    }

    function onSubmit(data: TourFormValues) {
        console.log(data)
        // Perform API call
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {duplicateMatch && (
                    <Alert className="border-primary/50 bg-primary/10 text-primary-foreground">
                        <CopyIcon className="h-4 w-4 stroke-primary" />
                        <AlertTitle className="text-primary">Ähnliche Tour gefunden</AlertTitle>
                        <AlertDescription className="flex items-center justify-between text-muted-foreground">
                            <span>
                                Wir haben eine Tour mit dem Namen <strong>{duplicateMatch.title}</strong> gefunden. Möchtest du die Daten kopieren?
                            </span>
                            <Button size="sm" variant="outline" type="button" onClick={applyDuplicate} className="ml-4 bg-background hover:bg-accent/50">
                                Daten übernehmen
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
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

                <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Art</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wähle eine Art" />
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
                                            <SelectValue placeholder="Grad wählen" />
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

                    <FormField
                        control={form.control}
                        name="guide"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tourenleiter</FormLabel>
                                <FormControl>
                                    <Input placeholder="Vorname Nachname" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="ascent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Aufstieg (hm)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="number" {...field} className="pr-12" />
                                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">hm</span>
                                    </div>
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
                                <FormLabel>Abstieg (hm)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="number" {...field} className="pr-12" />
                                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">hm</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex justify-between">
                                    <span>Dauer</span>
                                    <span className="text-muted-foreground font-normal">
                                        {field.value?.[0]}h - {field.value?.[1]}h
                                    </span>
                                </FormLabel>
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
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="whatsappLink"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WhatsApp Gruppe (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://chat.whatsapp.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* GPX Placeholder */}
                    <div className="flex flex-col gap-3">
                        <Label>GPX Datei (Optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-colors">
                            <UploadCloud className="h-8 w-8 mb-2" />
                            <span className="text-sm font-medium">Datei hier ablegen oder klicken</span>
                            <span className="text-xs text-muted-foreground/70 mt-1">.gpx Dateien bis 5MB</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" type="button">Abbrechen</Button>
                        <Button type="submit">Tour erstellen</Button>
                    </div>
            </form>
        </Form>
    )
}
