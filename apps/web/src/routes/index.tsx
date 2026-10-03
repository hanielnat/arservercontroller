import { createRoute, Link } from "@tanstack/react-router"

import { Route as rootRoute } from "./__root"

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
        <div>
            <h1>ARServerController</h1>
            <p>Welcome to the Arma Reforger Server Controller dashboard.</p>
            <div style={{ marginTop: "20px", display: "flex", gap: "16px" }}>
                <Link
                    to="/servers"
                    style={{
                        padding: "12px 24px",
                        background: "#0066cc",
                        color: "white",
                        borderRadius: "4px",
                        textDecoration: "none",
                    }}
                >
                    Manage Servers
                </Link>
            </div>
        </div>
    ),
})
