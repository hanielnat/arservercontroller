import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import type { Crumb } from "@/types/dashboard";

// Create a QueryClient instance
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

export interface DashboardContext {
    queryClient: QueryClient;
    crumb?: Crumb;
}

// Import the generated route tree
import { routeTree } from "@/routeTree.gen";

// Create router instance
export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    context: {
        queryClient,
    },
});

// Type-safe router registration
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
