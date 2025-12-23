import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import type { Metadata, Viewport } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "ASC Skiclub",
    description: "App für ASC Skiclub Mitglieder",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "ASC App",
    },
    icons: {
        icon: "/icon-192x192.png",
        apple: "/apple-touch-icon.png",
    },
}

export const viewport: Viewport = {
    themeColor: "#1a1a1a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // iOS Safe Areas
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster />
                    <ProgressBar
                        height="3px"
                        color="oklch(0.7 0.25 145)"
                        options={{ showSpinner: false }}
                        shallowRouting
                    />
                </ThemeProvider>
            </body>
        </html>
    )
}
