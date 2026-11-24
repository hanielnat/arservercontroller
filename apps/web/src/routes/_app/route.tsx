import { createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/features/servers";

export const Route = createFileRoute("/_app")({
  component: () => <DashboardLayout />,
  beforeLoad: () => ({ crumb: { label: "Dashboard", to: "/" } }),
});
