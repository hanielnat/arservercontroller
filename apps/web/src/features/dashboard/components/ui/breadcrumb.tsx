import { Link, useMatches } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DashboardBreadcrumbs() {
  const matches = useMatches();

  const crumbs = matches.map((match) => match.context?.crumb).filter(Boolean);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <BreadcrumbItem key={crumb?.to ?? crumb?.label}>
              {isLast ? (
                <BreadcrumbPage>{crumb?.label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink render={<Link to={crumb?.to}>{crumb?.label}</Link>} />
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
