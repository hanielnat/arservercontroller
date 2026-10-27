import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/logs")({
  component: () => <div className="mx-auto my-30">Logs</div>,
  beforeLoad: () => ({ crumb: { label: "Logs", to: "/logs" } }),
});
