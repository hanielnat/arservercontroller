import { Outlet } from "@tanstack/react-router";
import {
  ContainerIcon,
  LayoutDashboardIcon,
  LogsIcon,
  ServerIcon,
  SettingsIcon,
} from "lucide-react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/dashboard/components/ui/app-sidebar";
import DashboardBreadcrumbs from "@/features/dashboard/components/ui/breadcrumb";
import DashboardHeader from "@/features/dashboard/components/ui/header";
import { type NavMainItem, type SidebarData } from "@/features/dashboard/nav-types";

const navMain: NavMainItem[] = [
  {
    title: "Overview",
    url: "/",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Servers",
    url: "/",
    icon: <ServerIcon />,
    isActive: true,
    subItems: [
      {
        title: "Create",
        url: "/servers/create",
      },
      {
        title: "Dynamic server 01",
        href: "#",
      },
      {
        title: "Dynamic server 02",
        href: "#",
      },
      {
        title: "Dynamic server 03",
        href: "#",
      },
    ],
  },
  {
    title: "Logs",
    url: "/logs",
    icon: <LogsIcon />,
  },
  {
    title: "Docker Status",
    url: "/docker",
    icon: <ContainerIcon />,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: <SettingsIcon />,
  },
] satisfies NavMainItem[];

const sidebarData: SidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: navMain,
} satisfies SidebarData;

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar navMain={navMain} user={sidebarData.user} />

      <SidebarInset>
        <DashboardHeader>
          <DashboardBreadcrumbs />
        </DashboardHeader>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
