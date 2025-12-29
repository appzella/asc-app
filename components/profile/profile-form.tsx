"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CameraIcon, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile"
import { updateUserProfile, uploadProfilePhoto } from "@/app/actions/profile"
import { User } from "@/lib/types"
import { ImageCropper } from "@/components/ui/image-cropper"

interface ProfileFormProps {
    user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Image Cropper State
    const [showCropper, setShowCropper] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    const defaultValues: Partial<ProfileFormValues> = {
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        phone: user.phone || "",
        mobile: user.mobile || "",
        street: user.street || "",
        zip: user.zip || "",
        city: user.city || "",
        profilePhoto: user.profilePhoto || null,
    }

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues,
        mode: "onChange",
    })

    const roleMap: Record<string, string> = {
        admin: "Administrator",
        leader: "Tourenleiter",
        member: "Mitglied",
    }

    /* Image Handling Logic */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                if (e.target?.result) {
                    setSelectedImage(e.target.result as string)
                    setShowCropper(true)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDeletePhoto = () => {
        form.setValue("profilePhoto", null, { shouldDirty: true })
        setSelectedImage(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleCropComplete = async (croppedBlob: Blob) => {
        setShowCropper(false)
        setSelectedImage(null)
        setIsUploading(true)

        try {
            // Create File from Blob for upload
            const file = new File([croppedBlob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' })
            const formData = new FormData()
            formData.append('file', file)

            // Upload to Supabase Storage via server action
            const result = await uploadProfilePhoto(user.id, formData)

            if (result.status === 'success' && result.url) {
                form.setValue('profilePhoto', result.url, { shouldDirty: true })
                toast.success('Bild hochgeladen')
            } else {
                toast.error(result.message || 'Fehler beim Hochladen')
            }
        } catch (error) {
            toast.error('Fehler beim Hochladen')
            console.error('Upload error:', error)
        } finally {
            setIsUploading(false)
        }
    }

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true)

        try {
            // Call server action
            const result = await updateUserProfile(user.id, data)

            if (result.status === "success") {
                toast.success(result.message)
                router.refresh()
            } else if (result.status === "error") {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {showCropper && selectedImage && (
                <ImageCropper
                    image={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false)
                        setSelectedImage(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    cropShape="round"
                />
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profilbild</CardTitle>
                                <CardDescription>
                                    Klicke auf das Bild, um es zu ändern.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center sm:flex-row gap-8">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Avatar className="w-32 h-32 ring-2 ring-border shadow-lg">
                                        {form.watch("profilePhoto") && (
                                            <AvatarImage src={form.watch("profilePhoto")!} />
                                        )}
                                        <AvatarFallback className="text-4xl">
                                            {defaultValues.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CameraIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                </div>
                                <div className="space-y-2 text-center sm:text-left">
                                    <h3 className="font-medium text-lg">Profilfoto</h3>
                                    <p className="text-sm text-muted-foreground max-w-[250px]">
                                        Lade ein neues Bild hoch. JPG, GIF oder PNG. Max. 5MB.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            Bild hochladen
                                        </Button>
                                        {form.watch("profilePhoto") && (
                                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDeletePhoto}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Entfernen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Persönliche Informationen</CardTitle>
                                <CardDescription>
                                    Diese Informationen werden für die Tourenverwaltung verwendet.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Dein Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-Mail</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled readOnly className="bg-muted" />
                                                </FormControl>
                                                <FormDescription>
                                                    Kann nicht geändert werden.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rolle</FormLabel>
                                                <FormControl>
                                                    {/* Show formatted role but keep real value in form state if needed, here just display */}
                                                    <Input value={roleMap[field.value as string] || field.value} disabled readOnly className="bg-muted" />
                                                </FormControl>
                                                <FormDescription>
                                                    Deine Berechtigungsstufe im System.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Kontakt & Adresse</CardTitle>
                                <CardDescription>
                                    Deine Kontaktdaten für Notfälle und Kommunikation.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="mobile"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobiltelefon</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+41 79 123 45 67" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Festnetz</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+41 71 123 45 67" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Strasse / Nr.</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Musterstrasse 1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 grid-cols-[1fr_2fr]">
                                    <FormField
                                        control={form.control}
                                        name="zip"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PLZ</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="9000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ort</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="St. Gallen" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Speichern
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </>
    )
}
