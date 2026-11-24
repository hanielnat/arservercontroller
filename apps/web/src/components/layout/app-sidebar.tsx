import type React from "react";

import { NavMain } from "@/components/layout/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SidebarData } from "@/types";

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex",
        "items-center",
        "rounded-sm",
        "ring-border hover:ring-1",
        "transition-all",
        collapsed ? "p-0" : "bg-secondary p-1",
      )}
    >
      <div
        className="
          flex items-center justify-center rounded-sm bg-primary p-2 text-sm font-bold
          text-primary-foreground
        "
      >
        AR
      </div>

      {!collapsed && (
        <div className="ml-2 flex flex-col leading-none">
          <span className="font-semibold tracking-tight">AR Controller</span>
          <span className="text-[10px] text-muted-foreground">v0.1</span>
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

      <SidebarRail />
    </Sidebar>
  );
}
