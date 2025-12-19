"use server"

import { revalidatePath } from "next/cache"
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

        // Prepare update data mapping manually
        const updateData: Partial<User> = {
            name,
            phone: phone === '' ? undefined : phone,
            mobile: mobile === '' ? undefined : mobile,
            street: street === '' ? undefined : street,
            zip: zip === '' ? undefined : zip,
            city: city === '' ? undefined : city,
        }

        // Handle profilePhoto specifically
        if (profilePhoto !== undefined) {
            // Cast to string or null if necessary, assuming User type expects string | null
            updateData.profilePhoto = profilePhoto as string | null
        }

        // Use repository instead of direct Supabase call
        const updatedUser = await dataRepository.updateUser(userId, updateData)

        if (!updatedUser) {
            console.error("Repository update failed")
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
