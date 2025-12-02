import {
    Users,
    Settings,
    LayoutGrid,
    LucideIcon,
    Mountain,
    LifeBuoy,
    User
} from "lucide-react";

type Submenu = {
    href: string;
    label: string;
    active?: boolean;
};

type Menu = {
    href: string;
    label: string;
    active?: boolean;
    icon: LucideIcon;
    submenus?: Submenu[];
};

type Group = {
    groupLabel: string;
    menus: Menu[];
};

export function getMenuList(pathname: string, role?: string): Group[] {
    const isAdmin = role === 'admin';
    const isLeader = role === 'leader';
    const canCreateTours = isAdmin || isLeader;

    return [
        {
            groupLabel: "",
            menus: [
                {
                    href: "/dashboard",
                    label: "Dashboard",
                    icon: LayoutGrid,
                    submenus: []
                }
            ]
        },
        {
            groupLabel: "Touren",
            menus: [
                {
                    href: "/tours",
                    label: "Touren",
                    icon: Mountain,
                    submenus: [
                        {
                            href: "/tours",
                            label: "Übersicht"
                        },
                        ...(canCreateTours ? [{
                            href: "/tours/create",
                            label: "Tour erstellen"
                        }] : [])
                    ]
                }
            ]
        },
        ...(isAdmin ? [{
            groupLabel: "Verwaltung",
            menus: [
                {
                    href: "/settings",
                    label: "Einstellungen",
                    icon: Settings,
                    submenus: [
                        {
                            href: "/settings",
                            label: "Allgemein"
                        },
                        {
                            href: "/users",
                            label: "Benutzer"
                        },
                        {
                            href: "/invitations",
                            label: "Einladungen"
                        }
                    ]
                }
            ]
        }] : []),
        {
            groupLabel: "Account",
            menus: [
                {
                    href: "/profile",
                    label: "Profil",
                    icon: User
                },
                {
                    href: "/help",
                    label: "Hilfe",
                    icon: LifeBuoy
                }
            ]
        }
    ];
}
