"use client"

import { useId } from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"

function NavAdminSubItem({
    subItem,
    onNavigate,
}: {
    subItem: { title: string; url: string }
    onNavigate: () => void
}) {
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild>
                <Link href={subItem.url} onClick={onNavigate}>
                    <span>{subItem.title}</span>
                </Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    )
}

function NavAdminItem({
    item,
    onNavigate,
}: {
    item: {
        title: string
        url: string
        icon: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }
    onNavigate: () => void
}) {
    const id = useId()

    return (
        <Collapsible
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.items && (
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        )}
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.items && (
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem) => (
                                <NavAdminSubItem key={subItem.title} subItem={subItem} onNavigate={onNavigate} />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                )}
            </SidebarMenuItem>
        </Collapsible>
    )
}

export function NavAdmin({
    items,
}: {
    items: {
        title: string
        url: string
        icon: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    const { isMobile, setOpenMobile } = useSidebar()

    const handleNavigation = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <NavAdminItem key={item.title} item={item} onNavigate={handleNavigation} />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
