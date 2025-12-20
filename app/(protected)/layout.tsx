import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="overflow-hidden">
                <SiteHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
