import * as z from "zod"

export const profileSchema = z.object({
    name: z.string().min(2, {
        message: "Name muss mindestens 2 Zeichen lang sein.",
    }),
    email: z.string().email(),
    role: z.string(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    street: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
    profilePhoto: z.string().optional().nullable(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
