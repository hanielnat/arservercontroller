import { createFileRoute } from "@tanstack/react-router";

import DashboardOverview from "@/features/dashboard/overview";

export const Route = createFileRoute("/_app/")({
  component: () => <DashboardOverview />,
  beforeLoad: () => ({ crumb: { label: "Overview", to: "/" } }),
});
