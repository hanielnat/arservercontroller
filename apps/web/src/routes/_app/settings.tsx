import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  component: () => <div className="mx-auto my-30">Settings</div>,
  beforeLoad: () => ({ crumb: { label: "Settings", to: "/settings" } }),
});
