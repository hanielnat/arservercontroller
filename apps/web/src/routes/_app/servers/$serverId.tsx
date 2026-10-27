import { createFileRoute } from "@tanstack/react-router";

import { ServerInfo } from "@/features/dashboard/server-info";
import { serversQueryOptions } from "@/hooks/use-servers";
import { queryClient } from "@/router";

export const Route = createFileRoute("/_app/servers/$serverId")({
  component: () => <ServerInfoPage />,
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
