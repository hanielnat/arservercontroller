import { createFileRoute } from "@tanstack/react-router";

import { ServerInfo } from "@/features/dashboard/server-info";

export const Route = createFileRoute("/_app/servers/$serverId")({
  component: () => <ServerInfoPage />,
});

function ServerInfoPage() {
  const { serverId } = Route.useParams();
  return <ServerInfo id={serverId} />;
}
