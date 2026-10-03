import { createRoute, Outlet } from "@tanstack/react-router";

import { Route as rootRoute } from "./__root";

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/servers",
    component: () => (
        <div>
            <h2 className="bg-accent">Servers</h2>
            <p>Manage your Arma Reforger dedicated servers.</p>
            <Outlet />
        </div>
    ),
})
