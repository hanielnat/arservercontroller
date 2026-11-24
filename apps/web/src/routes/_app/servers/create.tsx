import { createFileRoute } from "@tanstack/react-router";

import { CreateServer } from "@/features/servers";

export const Route = createFileRoute("/_app/servers/create")({
  component: () => <CreateServer />,
  beforeLoad: () => ({
    crumb: {
      label: "Create Server",
      to: "/servers/create",
    },
  }),
});
