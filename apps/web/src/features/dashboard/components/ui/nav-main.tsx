import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";

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

import type { NavMainItem, NavMainSubItem } from "../nav-types";

function NavSubButton({ item }: { item: NavMainSubItem }) {
  if (item.url !== undefined) {
    return (
      <SidebarMenuSubButton render={<Link to={item.url} />}>{item.title}</SidebarMenuSubButton>
    );
  }
  return (
    <SidebarMenuSubButton render={<a href={item.href ?? "#"} />}>{item.title}</SidebarMenuSubButton>
  );
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
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton
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
