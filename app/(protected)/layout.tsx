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
                {/* Mobile: fixed header + scroll content | Desktop: normal overflow-hidden */}
                <SidebarInset className="flex flex-col h-screen overflow-hidden md:h-auto">
                    <SiteHeader />
                    <div className="flex-1 overflow-y-auto md:overflow-visible">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    )
}
