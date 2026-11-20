import { createFileRoute, notFound } from "@tanstack/react-router";

import Pending from "@/components/layout/pending";
import { RouteError } from "@/components/layout/route-error";
import { ServerInfo } from "@/features/dashboard/server-info";
import { serversQueryOptions } from "@/hooks/use-servers";
import { queryClient } from "@/router";
import type { ServerOut } from "@/types/server";

export const Route = createFileRoute("/_app/servers/$serverId")({
  pendingMs: 200,
  pendingMinMs: 300,
  component: () => <ServerInfo />,
  pendingComponent: () => <Pending />,
  errorComponent: ({ error, reset }) => <RouteError error={error as Error} reset={reset} />,
  beforeLoad: async ({ params }) => {
    const server = await queryClient.query({
      ...serversQueryOptions(),
      select: (data) => data.data.find((s) => params.serverId === s.serverConfigData.id),
    });

    if (!server) {
      throw notFound();
    }

    return {
      server,
      crumb: {
        label: server.serverConfigData.name,
        to: `/servers/${params.serverId}`,
      },
    };
  },
  loader: async ({ context }) => {
    return { server: context.server };
  },
});
