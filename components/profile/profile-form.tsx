'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Upload, Trash2, Loader2 } from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { toast } from 'sonner'
import { dataRepository } from '@/lib/data'
import { authService } from '@/lib/auth'

const profileSchema = z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    street: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
    user: User
    setUser: (user: User) => void
}

export function ProfileForm({ user, setUser }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showCropper, setShowCropper] = useState(false)
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            mobile: user.mobile || '',
            street: user.street || '',
            zip: user.zip || '',
            city: user.city || '',
        },
    })

    const processFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Die Datei ist zu groß. Bitte wähle eine Datei unter 5MB.')
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Bitte wähle ein Bild aus.')
            return
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string
            setImageToCrop(imageDataUrl)
            setShowCropper(true)
        }
        reader.onerror = () => {
            toast.error('Fehler beim Lesen der Datei')
        }
        reader.readAsDataURL(file)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        processFile(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragging) {
            setIsDragging(true)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        setShowCropper(false)
        setImageToCrop(null)
        setIsLoading(true)

        try {
            const croppedFile = new File([croppedImageBlob], 'profile-photo.jpg', {
                type: 'image/jpeg',
            })

            if (user.profilePhoto && !user.profilePhoto.startsWith('data:')) {
                try {
                    const repo = dataRepository as any
                    if (repo.deleteProfilePhoto) {
                        await repo.deleteProfilePhoto(user.profilePhoto)
                    }
                } catch (deleteError) {
                    console.warn('Could not delete old photo:', deleteError)
                }
            }

            const repo = dataRepository as any
            if (typeof repo.uploadProfilePhoto === 'function') {
                const photoUrl = await repo.uploadProfilePhoto(user.id, croppedFile)
                const updatedUser = await dataRepository.updateUser(user.id, {
                    profilePhoto: photoUrl,
                })

                if (updatedUser) {
                    setUser(updatedUser)
                    await authService.refreshCurrentUser()
                    toast.success('Profilfoto erfolgreich aktualisiert!')
                }
            } else {
                const reader = new FileReader()
                reader.onloadend = async () => {
                    const base64String = reader.result as string
                    const updatedUser = await dataRepository.updateUser(user.id, {
                        profilePhoto: base64String,
                    })
                    if (updatedUser) {
                        setUser(updatedUser)
                        await authService.refreshCurrentUser()
                        toast.success('Profilfoto erfolgreich aktualisiert!')
                    }
                }
                reader.readAsDataURL(croppedFile)
            }
        } catch (err) {
            console.error('Upload error:', err)
            toast.error('Fehler beim Hochladen des Profilfotos')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemovePhoto = async () => {
        if (!user.profilePhoto) return

        setIsLoading(true)
        try {
            if (!user.profilePhoto.startsWith('data:')) {
                try {
                    const repo = dataRepository as any
                    if (typeof repo.deleteProfilePhoto === 'function') {
                        await repo.deleteProfilePhoto(user.profilePhoto)
                    }
                } catch (deleteError) {
                    console.warn('Could not delete photo from storage:', deleteError)
                }
            }

            const updatedUser = await dataRepository.updateUser(user.id, {
                profilePhoto: null,
            })

            if (updatedUser) {
                setUser(updatedUser)
                await authService.refreshCurrentUser()
                toast.success('Profilfoto entfernt!')
            }
        } catch (err) {
            toast.error('Fehler beim Entfernen des Profilfotos')
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (values: ProfileFormValues) => {
        setIsLoading(true)
        try {
            const updatedUser = await dataRepository.updateUser(user.id, {
                name: values.name,
                phone: values.phone?.trim() || '',
                mobile: values.mobile?.trim() || '',
                street: values.street?.trim() || '',
                zip: values.zip?.trim() || '',
                city: values.city?.trim() || '',
            })

            if (updatedUser) {
                setUser(updatedUser)
                await authService.refreshCurrentUser()
                toast.success('Profil erfolgreich aktualisiert!')
            }
        } catch (err) {
            toast.error('Fehler beim Aktualisieren des Profils')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {showCropper && imageToCrop && (
                <ImageCropper
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false)
                        setImageToCrop(null)
                    }}
                    aspectRatio={1}
                    cropShape="round"
                />
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Profilfoto Section */}
                    <div className="flex items-center gap-6">
                        <div
                            className="relative group flex-shrink-0 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Avatar className="w-24 h-24 border-2 border-muted hover:border-primary transition-colors">
                                <AvatarImage
                                    src={user.profilePhoto || undefined}
                                    alt={user.name}
                                    className="object-cover"
                                    key={user.profilePhoto || user.id}
                                />
                                <AvatarFallback className="text-2xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium">Profilbild</h3>
                            <p className="text-sm text-muted-foreground">
                                Klicken Sie auf das Bild oder ziehen Sie eine Datei hierher, um es zu ändern.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    Hochladen
                                </Button>
                                {user.profilePhoto && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemovePhoto}
                                        disabled={isLoading}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        Entfernen
                                    </Button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {isDragging && (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                        >
                            <div className="flex flex-col items-center gap-4 p-8 rounded-lg border-2 border-dashed border-primary bg-background shadow-xl">
                                <Upload className="w-12 h-12 text-primary animate-bounce" />
                                <p className="text-lg font-medium text-primary">Loslassen zum Hochladen</p>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ihr Name" {...field} />
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
                                        <Input type="email" disabled className="bg-muted" {...field} />
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
                                    <FormLabel>Telefon (Festnetz)</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            defaultCountry="CH"
                                            countries={['CH', 'DE', 'AT', 'FR', 'IT', 'LI']}
                                            value={field.value || undefined}
                                            onChange={(value) => {
                                                if (value && /^\+[0-9]{1,3}$/.test(value)) {
                                                    field.onChange(undefined)
                                                } else {
                                                    field.onChange(value || undefined)
                                                }
                                            }}
                                            placeholder="Telefonnummer eingeben"
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            defaultCountry="CH"
                                            countries={['CH', 'DE', 'AT', 'FR', 'IT', 'LI']}
                                            value={field.value || undefined}
                                            onChange={(value) => {
                                                if (value && /^\+[0-9]{1,3}$/.test(value)) {
                                                    field.onChange(undefined)
                                                } else {
                                                    field.onChange(value || undefined)
                                                }
                                            }}
                                            placeholder="Handynummer eingeben"
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium">Adresse</h4>
                            <p className="text-xs text-muted-foreground">Deine Kontaktadresse für den Verein.</p>
                        </div>

                        <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Strasse & Nr.</FormLabel>
                                    <FormControl>
                                        <AddressAutocomplete
                                            value={form.watch('street') || ''}
                                            onChange={(value) => {
                                                field.onChange(value)
                                            }}
                                            onAddressSelect={(address) => {
                                                form.setValue('street', address.street)
                                                form.setValue('zip', address.zip)
                                                form.setValue('city', address.city)
                                            }}
                                            placeholder="Adresse eingeben"
                                            useGooglePlaces={!!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
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

                            <div className="col-span-2">
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
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Änderungen speichern
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    )
}
