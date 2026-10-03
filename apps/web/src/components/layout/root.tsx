import { Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ModeToggle } from "../mode-toggle";

export function Root() {
    return (
        <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
            <header
                style={{
                    marginBottom: "20px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid #e0e0e0",
                }}
            >
                <nav style={{ display: "flex", gap: "16px" }}>
                    <Link to="/" style={{ textDecoration: "none", color: "#333", fontWeight: 500 }}>
                        Home
                    </Link>
                    <Link
                        to="/servers"
                        style={{ textDecoration: "none", color: "#333", fontWeight: 500 }}
                    >
                        Servers
                    </Link>
                </nav>
                <ModeToggle />
            </header>
            <Outlet />
            <TanStackRouterDevtools position="bottom-right" />
        </div>
    )
}