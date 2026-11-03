import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, ServerIcon } from "lucide-react";
import type React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import type { NavMainItem, NavMainSubItem } from "@/features/dashboard/nav-types";
import { serversQueryOptions } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";

function NavSubButton({
  item,
  className,
  ...props
}: { item: NavMainSubItem } & React.ComponentProps<typeof SidebarMenuSubButton>) {
  if (item.url !== undefined) {
    return (
      <SidebarMenuSubButton
        className={cn(className)}
        {...props}
        render={
          <Link to={item.url}>
            {item.icon}
            {item.title}
          </Link>
        }
      />
    );
  }
  return (
    <SidebarMenuSubButton
      className={cn(className)}
      {...props}
      render={
        <a href={item.href ?? "#"}>
          {item.icon}
          {item.title}
        </a>
      }
    />
  );
}

function NavServerList() {
  const max = 5;

  const { data: servers, isPending } = useQuery({
    ...serversQueryOptions(),
    refetchInterval: 5000,
    select: (data) =>
      data.data
        .filter((server) => server.serverConfigData.status === "running")
        .slice(0, max)
        .toSorted((a, b) => b.updatedAt - a.updatedAt)
        .map((s) => s.serverConfigData),
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  return servers?.map((s) => (
    <SidebarMenuSubItem key={s.id}>
      <SidebarMenuSubButton
        render={
          <Link to="/servers/$serverId" params={{ serverId: s.id }}>
            <ServerIcon />
            <ServerHealthIndicator id={s.id} />
            <span className="font-sm truncate">{s.name}</span>
          </Link>
        }
      />
    </SidebarMenuSubItem>
  ));
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.subItems !== undefined && item.subItems?.length > 0 ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
                {item.icon}

                <span>{item.title}</span>

                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.subItems?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <NavSubButton item={subItem} />
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>

                <SidebarMenuSub>
                  {item.dynamicSubItems && item.dynamicSubItems === "runningServers" && (
                    <NavServerList />
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton
              key={item.title}
              tooltip={item.title}
              render={
                item.url !== undefined ? <Link to={item.url} /> : <a href={item.href ?? "#"} />
              }
            >
              {item.icon}

              <span>{item.title}</span>
            </SidebarMenuButton>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
