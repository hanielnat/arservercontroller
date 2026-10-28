import type React from "react";

import type { FileRoutesByFullPath } from "@/routeTree.gen";

export type RoutePath = keyof FileRoutesByFullPath;

export interface NavMainSubItem {
    title: string;
    url?: RoutePath;
    href?: string;
    icon?: React.ReactNode;
}

export interface NavMainItem {
    title: string;
    url?: RoutePath;
    href?: string;
    icon: React.ReactNode;
    isActive?: boolean;
    subItems?: NavMainSubItem[];
    dynamicSubItems?: "runningServers" | "other";
}

export interface SidebarData {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
    navMain: NavMainItem[];
}
