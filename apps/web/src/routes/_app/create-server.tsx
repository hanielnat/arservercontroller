import { createFileRoute } from "@tanstack/react-router";

import CreateServer from "@/features/dashboard/create-server";

export const Route = createFileRoute("/_app/create-server")({
  component: () => <CreateServer />,
});
