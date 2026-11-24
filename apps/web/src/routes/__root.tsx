import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import NotFound from "@/components/layout/not-found";
import Pending from "@/components/layout/pending";
import { RouteError } from "@/components/layout/route-error";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PendingServerOperations } from "@/features/servers";
import { SettingsProvider } from "@/hooks/providers/settings-provider";
import { ThemeProvider } from "@/hooks/providers/theme-provider";
import { type DashboardContext } from "@/router";

export const Route = createRootRouteWithContext<DashboardContext>()({
  component: () => <RootLayout />,
  pendingComponent: () => <Pending />,
  errorComponent: ({ error, reset }) => <RouteError error={error as Error} reset={reset} />,
  notFoundComponent: () => <NotFound />,
});

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="dark-mode">
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <PendingServerOperations />
          <Outlet />
          <hr />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          <TanStackRouterDevtools />
        </TooltipProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
