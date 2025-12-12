"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { dataRepository } from "@/lib/data"
import { authService } from "@/lib/auth"

const registerSchema = z.object({
    name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
    password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [invitation, setInvitation] = useState<any>(null)
    const [error, setError] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            password: "",
            confirmPassword: "",
        },
    })

    useEffect(() => {
        async function validateToken() {
            try {
                const inv = await dataRepository.getInvitationByToken(token)
                if (inv) {
                    setInvitation(inv)
                } else {
                    setError("Diese Einladung ist ungültig oder wurde bereits verwendet.")
                }
            } catch (err) {
                console.error("Token validation error", err)
                setError("Fehler beim Prüfen der Einladung.")
            } finally {
                setIsValidating(false)
            }
        }
        validateToken()
    }, [token])

    async function onSubmit(data: RegisterFormValues) {
        if (!invitation) return

        setIsLoading(true)
        setError("")

        try {
            const user = await authService.register(invitation.email, data.password, data.name, token)

            if (user) {
                // Direct login success
                router.push("/")
                router.refresh()
            } else {
                // Email confirmation required flow
                setIsSuccess(true)
            }
        } catch (err) {
            console.error("Registration failed", err)
            setError("Ein Fehler ist aufgetreten.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isValidating) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error && !invitation) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Einladung Fehlerhaft</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/login">Zur Anmeldung</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Registrieren</CardTitle>
                <CardDescription>
                    Erstelle dein Konto für <strong>{invitation?.email}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSuccess ? (
                    <div className="space-y-6">
                        <Alert className="border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Registrierung erfolgreich</AlertTitle>
                            <AlertDescription>
                                Bitte prüfe dein E-Mail-Postfach, um dein Konto zu bestätigen.
                            </AlertDescription>
                        </Alert>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">Zur Anmeldung</Link>
                        </Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Dein Name"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Passwort</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                {...field}
                                                disabled={isLoading}
                                            />
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
                                            <Input
                                                type="password"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Konto erstellen
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    )
}
