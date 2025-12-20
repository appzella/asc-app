import React from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface ContentLayoutProps {
    title: string
    children: React.ReactNode
    breadcrumbs?: {
        label: string
        href?: string
        active?: boolean
    }[]
}

export function ContentLayout({ title, children, breadcrumbs }: ContentLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-6" />
                <h1 className="font-semibold text-lg">{title}</h1>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <BreadcrumbItem>
                                            {item.href && !item.active ? (
                                                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>
                                        {index < breadcrumbs.length - 1 && (
                                            <BreadcrumbSeparator />
                                        )}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </>
                )}
            </header>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
