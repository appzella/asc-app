"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"

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
import { authService } from "@/lib/auth"

const forgotPasswordSchema = z.object({
    email: z.string().email("Ungültige E-Mail-Adresse"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState("")

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(data: ForgotPasswordFormValues) {
        setIsLoading(true)
        setError("")

        try {
            await authService.resetPassword(data.email)
            setIsSuccess(true)
        } catch (err) {
            console.error("Reset password failed", err)
            setError("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Passwort vergessen</CardTitle>
                <CardDescription>
                    Gib deine E-Mail ein, um einen Link zum Zurücksetzen zu erhalten.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSuccess ? (
                    <div className="space-y-6">
                        <Alert className="border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>E-Mail gesendet</AlertTitle>
                            <AlertDescription>
                                Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link gesendet.
                            </AlertDescription>
                        </Alert>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">Zurück zur Anmeldung</Link>
                        </Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-Mail</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
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
                                Link senden
                            </Button>

                            <Button asChild variant="link" className="w-full font-normal text-muted-foreground" size="sm">
                                <Link href="/login" className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" /> Zurück zur Anmeldung
                                </Link>
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    )
}
