import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <SidebarProvider>
                <AppSidebar variant="inset" />
                <SidebarInset className="overflow-hidden">
                    <SiteHeader />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    )
}
