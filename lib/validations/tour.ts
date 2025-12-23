import { z } from "zod"

export const tourFormSchema = z.object({
    title: z
        .string()
        .min(2, {
            message: "Titel muss mindestens 2 Zeichen lang sein.",
        })
        .max(50, {
            message: "Titel darf maximal 50 Zeichen lang sein.",
        }),
    description: z.string().max(500, {
        message: "Beschreibung darf maximal 500 Zeichen lang sein.",
    }).optional(),
    date: z.date(),
    type: z.string(),
    difficulty: z.string(),
    length: z.string().optional(),
    peak: z.string().max(50).optional(),
    peakElevation: z.coerce.number().min(0).max(9000).optional(),
    ascent: z.coerce.number().min(0).optional(),
    descent: z.coerce.number().min(0).optional(),
    duration: z.array(z.number()).min(2).max(2).optional(), // Range slider [min, max]
    maxParticipants: z.coerce.number().min(1).max(50).optional(),
    whatsappLink: z.string().url({ message: "Bitte gib eine gültige URL ein." }).optional().or(z.literal("")),
    gpx: z.any().optional(),
})

export type TourFormValues = z.infer<typeof tourFormSchema>

