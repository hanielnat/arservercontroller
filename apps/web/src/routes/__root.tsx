import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { tableDevtoolsPlugin } from "@tanstack/react-table-devtools";

import NotFound from "@/components/layout/not-found";
import Pending from "@/components/layout/pending";
import { Toaster } from "@/components/ui/toast";

export const Route = createRootRoute({
  component: () => <RootLayout />,
  pendingComponent: () => <Pending />,
  notFoundComponent: () => <NotFound />,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
      <hr />
      <TanStackDevtools
        config={{ hideUntilHover: true }}
        plugins={[formDevtoolsPlugin(), tableDevtoolsPlugin()]}
      />
      <TanStackRouterDevtools />
    </>
  );
}
