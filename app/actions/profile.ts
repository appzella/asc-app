"use server"

import { revalidatePath } from "next/cache"
import { getServerRepository } from "@/lib/data/server"
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

        // Use server repository for proper RLS context
        const repository = await getServerRepository()
        const updatedUser = await repository.updateUser(userId, updateData)

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

export async function uploadProfilePhoto(
    userId: string,
    formData: FormData
): Promise<{ status: "success" | "error"; url?: string; message: string }> {
    try {
        const file = formData.get("file") as File
        if (!file) {
            return { status: "error", message: "Keine Datei ausgewählt" }
        }

        const repository = await getServerRepository()
        const url = await repository.uploadProfilePhoto(userId, file)

        revalidatePath("/profile")
        revalidatePath("/")

        return { status: "success", url, message: "Bild hochgeladen" }
    } catch (error) {
        console.error("Failed to upload profile photo", error)
        return { status: "error", message: "Fehler beim Hochladen" }
    }
}
