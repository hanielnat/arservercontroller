import type React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "@/features/dashboard/components/ui/nav-main";
import { NavUser } from "@/features/dashboard/components/ui/nav-user";
import type { SidebarData } from "@/features/dashboard/nav-types";
import { cn } from "@/lib/utils";

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex",
        "items-center",
        "rounded-sm",
        "hover:ring-1 ring-border",
        "transition-all",
        collapsed ? "p-0" : "p-1 bg-secondary",
      )}
    >
      <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-sm p-2 text-sm font-bold">
        AR
      </div>

      {!collapsed && (
        <div className="ml-2 flex flex-col leading-none">
          <span className="font-semibold tracking-tight">AR Controller</span>
          <span className="text-muted-foreground text-[10px]">v0.1</span>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  navMain,
  user,
  ...props
}: SidebarData & React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo collapsed={state === "collapsed"} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
