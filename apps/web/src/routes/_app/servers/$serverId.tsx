import { createFileRoute } from "@tanstack/react-router";

import { ServerInfo } from "@/features/dashboard/server-info";
import { serversQueryOptions } from "@/hooks/use-servers";
import { queryClient } from "@/router";
import Pending from "@/components/layout/pending";
import { RouteError } from "@/components/layout/route-error";

export const Route = createFileRoute("/_app/servers/$serverId")({
  component: () => <ServerInfoPage />,
  pendingComponent: () => <Pending />,
  errorComponent: ({ error, reset }) => <RouteError error={error as Error} reset={reset} />,
  pendingMs: 200,
  pendingMinMs: 300,
  beforeLoad: async ({ params }) => {
    const server = await queryClient.query({
      ...serversQueryOptions(),
      select: (data) => data.data.find((s) => params.serverId === s.serverConfigData.id),
    });
    const name = server?.serverConfigData.name;

    return {
      crumb: {
        label: name,
        to: `/servers/${params.serverId}`,
      },
    };
  },
});

function ServerInfoPage() {
  const { serverId } = Route.useParams();
  return <ServerInfo id={serverId} />;
}
