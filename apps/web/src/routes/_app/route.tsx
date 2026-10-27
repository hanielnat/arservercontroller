import { createFileRoute } from "@tanstack/react-router";

import DashboardLayout from "@/features/dashboard/layout";

export const Route = createFileRoute("/_app")({
  component: () => <DashboardLayout />,
  beforeLoad: () => ({ crumb: { label: "Dashboard", to: "/" } }),
});
