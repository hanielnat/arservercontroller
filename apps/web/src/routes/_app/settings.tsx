import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/servers";

export const Route = createFileRoute("/_app/settings")({
  component: () => <SettingsPage />,
  beforeLoad: () => ({ crumb: { label: "Settings", to: "/settings" } }),
});
