"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
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

import { tourFormSchema, type TourFormValues } from "@/lib/validations/tour"
import type { Tour } from '@/components/tours/tour-card'

// Mock Data
const MOCK_EXISTING_TOURS: Partial<Tour>[] = [
    {
        title: "Piz Palü",
        description: "Klassische Hochtour über den Normalweg.",
        ascent: 1200,
        descent: 1200,
        duration: "5h", // handled as string in legacy type, but form needs parsing logic ideally
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

const MOCK_GUIDES = [
    { id: "1", name: "Pascal Staub", role: "Admin" },
    { id: "2", name: "Max Muster", role: "Tourenleiter" },
    { id: "3", name: "Anna Alpin", role: "Tourenleiter" },
    { id: "4", name: "Felix Fels", role: "Tourenleiter" },
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

    function onSubmit(data: TourFormValues) {
        console.log(data)
        // Submit logic here
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Duplicate Alert */}
                {duplicateMatch && (
                    <Alert className="border-primary/50 bg-primary/10 text-primary-foreground">
                        <CopyIcon className="h-4 w-4 stroke-primary" />
                        <AlertTitle className="text-primary">Ähnliche Tour gefunden</AlertTitle>
                        <AlertDescription className="flex items-center justify-between text-muted-foreground mt-2">
                            <span>
                                Wir haben eine Tour mit dem Namen <strong>{duplicateMatch.title}</strong> gefunden. Möchtest du die Daten kopieren?
                            </span>
                            <Button size="sm" variant="outline" type="button" onClick={applyDuplicate} className="ml-4 bg-background hover:bg-accent/50">
                                Daten übernehmen
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Card 1: Allgemein */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Allgemein</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
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

                    {/* Card 2: Technische Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Technische Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Art</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Art" />
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
                                                        <SelectValue placeholder="Grad" />
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

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="ascent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Aufstieg</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" {...field} className="pr-8" />
                                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">hm</span>
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
                                            <FormLabel>Abstieg</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" {...field} className="pr-8" />
                                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">hm</span>
                                                </div>
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
                        </CardContent>
                    </Card>

                    {/* Card 3: Organisation & Dateien */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Organisation & Dateien</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
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
                                                            {guide.name} <span className="text-muted-foreground text-xs ml-2">({guide.role})</span>
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
                                            <FormLabel>WhatsApp Gruppe (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://chat.whatsapp.com/..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <FormField
                                    control={form.control}
                                    name="gpx"
                                    render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem>
                                            <FormLabel>GPX Datei (Optional)</FormLabel>
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
                                            <p className="text-[0.8rem] text-muted-foreground">
                                                Erlaubte Formate: .gpx (max. 5MB)
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button">Abbrechen</Button>
                    <Button type="submit">Tour erstellen</Button>
                </div>
            </form>
        </Form>
    )
}
