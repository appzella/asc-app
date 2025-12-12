"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { dataRepository } from "@/lib/data"
import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile"
import { User } from "@/lib/types"

export type ProfileState = {
    status: "idle" | "success" | "error"
    message: string
    errors?: Partial<Record<keyof ProfileFormValues, string[]>>
}

export async function updateUserProfile(
    userId: string,
    data: ProfileFormValues
): Promise<ProfileState> {
    // Validate input
    const validatedFields = profileSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            status: "error",
            message: "Bitte überprüfe deine Eingaben.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Update logic
    try {
        const { name, phone, mobile, street, zip, city, profilePhoto } = validatedFields.data

        const supabase = await createClient()

        // Prepare update data mapping manually since we aren't using repo
        const updateData: any = {
            name,
            phone: phone === '' ? null : phone,
            mobile: mobile === '' ? null : mobile,
            street: street === '' ? null : street,
            zip: zip === '' ? null : zip,
            city: city === '' ? null : city,
        }

        // Handle profilePhoto specifically
        if (profilePhoto !== undefined) {
            updateData.profile_photo = profilePhoto
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)

        if (error) {
            console.error("Supabase update error:", error)
            return {
                status: "error",
                message: "Datenbankfehler beim Aktualisieren.",
            }
        }

        revalidatePath("/profile")
        revalidatePath("/") // Update sidebar name as well

        return {
            status: "success",
            message: "Profil erfolgreich aktualisiert.",
        }
    } catch (error) {
        console.error("Failed to update profile", error)
        return {
            status: "error",
            message: "Ein unerwarteter Fehler ist aufgetreten.",
        }
    }
}
