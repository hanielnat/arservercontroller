import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

// Create a QueryClient instance
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

// Import the generated route tree
import { routeTree } from "@/routeTree.gen";

// Create router instance
export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
});

// Type-safe router registration
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
