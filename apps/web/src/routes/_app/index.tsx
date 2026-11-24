import { createFileRoute } from "@tanstack/react-router";

import Pending from "@/components/layout/pending";
import { DashboardOverview, serversQueryOptions } from "@/features/servers";

export const Route = createFileRoute("/_app/")({
  component: () => <DashboardOverview />,
  pendingComponent: () => <Pending />,
  beforeLoad: () => {
    return {
      crumb: { label: "Overview", to: "/" },
    };
  },
  loader: ({ context }) => context.queryClient.query(serversQueryOptions()),
});
