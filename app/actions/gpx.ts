'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadGpxFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File
        const tourId = formData.get('tourId') as string

        if (!file || !tourId) {
            return { success: false, error: 'Fehlende Daten' }
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'Datei zu groß (max. 5MB)' }
        }

        // Check file type
        if (!file.name.endsWith('.gpx')) {
            return { success: false, error: 'Nur GPX-Dateien erlaubt' }
        }

        const supabase = await createClient()

        // Upload to Supabase Storage
        const fileName = `${tourId}/${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage
            .from('gpx-files')
            .upload(fileName, file)

        if (error) {
            console.error('GPX upload error:', error)
            return { success: false, error: 'Upload fehlgeschlagen' }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('gpx-files')
            .getPublicUrl(data.path)

        // Update tour with GPX URL
        const repository = await getServerRepository()
        await repository.updateTour(tourId, { gpxFile: urlData.publicUrl })

        revalidatePath(`/tours/${tourId}`)

        return { success: true, url: urlData.publicUrl }
    } catch (error) {
        console.error('GPX upload error:', error)
        return { success: false, error: 'Unbekannter Fehler' }
    }
}

export async function deleteGpxFile(tourId: string, gpxUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        // Extract path from URL
        const path = gpxUrl.split('/gpx-files/')[1]
        if (path) {
            await supabase.storage.from('gpx-files').remove([path])
        }

        // Update tour to remove GPX URL
        const repository = await getServerRepository()
        await repository.updateTour(tourId, { gpxFile: undefined })

        revalidatePath(`/tours/${tourId}`)

        return { success: true }
    } catch (error) {
        console.error('GPX delete error:', error)
        return { success: false, error: 'Löschen fehlgeschlagen' }
    }
}
