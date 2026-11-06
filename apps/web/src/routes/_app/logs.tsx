import { createFileRoute } from "@tanstack/react-router";

import { LogsPage } from "@/features/dashboard/logs";

export const Route = createFileRoute("/_app/logs")({
  component: () => <LogsPage />,
  beforeLoad: () => ({ crumb: { label: "Logs", to: "/logs" } }),
});
