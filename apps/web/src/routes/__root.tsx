import { createRootRoute } from "@tanstack/react-router";
import { Root } from "../components/layout/root";

export const Route = createRootRoute({
    component: () => <Root />,
})
