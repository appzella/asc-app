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
    date: z.date({
        required_error: "Bitte wähle ein Datum aus.",
    }),
    type: z.string({
        required_error: "Bitte wähle eine Tourenart aus.",
    }),
    difficulty: z.string({
        required_error: "Bitte wähle einen Schwierigkeitsgrad aus.",
    }),
    ascent: z.coerce.number().min(0).optional(),
    descent: z.coerce.number().min(0).optional(),
    duration: z.array(z.number()).min(2).max(2).optional(), // Range slider [min, max]
    guide: z.string().min(2, {
        message: "Bitte gib einen Tourenleiter an.",
    }),
    whatsappLink: z.string().url({ message: "Bitte gib eine gültige URL ein." }).optional().or(z.literal("")),
    // File upload is handled separately in the component state usually, or custom refined here
    // For now we just validate existence if needed, but it's optional
})

export type TourFormValues = z.infer<typeof tourFormSchema>
