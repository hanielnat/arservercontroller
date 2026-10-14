import { createFileRoute } from "@tanstack/react-router";

import DashboardContent from "@/features/dashboard/page";

export const Route = createFileRoute("/_app/")({
  component: () => <DashboardContent />,
});
