import { createFileRoute } from "@tanstack/react-router";

import { LogsPage, serversQueryOptions } from "@/features/servers";

export const Route = createFileRoute("/_app/logs")({
  component: () => <LogsPage />,
  beforeLoad: () => ({ crumb: { label: "Logs", to: "/logs" } }),
  loader: async ({ context }) => {
    const { data: servers } = await context.queryClient.query({
      ...serversQueryOptions(),
    });
    return { servers };
  },
});
