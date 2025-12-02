'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { authService } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
    newPassword: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    confirmPassword: z.string().min(6, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

interface PasswordFormProps {
    user: User
}

export function PasswordForm({ user }: PasswordFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (values: PasswordFormValues) => {
        setIsLoading(true)

        try {
            // Verify current password by trying to login
            const testLogin = await authService.login(user.email, values.currentPassword)
            if (!testLogin) {
                form.setError('currentPassword', { message: 'Das aktuelle Passwort ist falsch' })
                setIsLoading(false)
                return
            }

            // Change password
            const success = await authService.changePassword(values.newPassword)

            if (success) {
                toast.success('Passwort erfolgreich geändert!')
                form.reset()
            } else {
                toast.error('Fehler beim Ändern des Passworts')
            }
        } catch (err) {
            console.error('Password change error:', err)
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Aktuelles Passwort</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Neues Passwort</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Passwort bestätigen</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Passwort ändern
                    </Button>
                </div>
            </form>
        </Form>
    )
}
