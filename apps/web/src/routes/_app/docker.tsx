import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/docker")({
  component: () => <div className="mx-auto my-30">Docker status</div>,
  beforeLoad: () => ({ crumb: { label: "Docker", to: "/docker" } }),
});
