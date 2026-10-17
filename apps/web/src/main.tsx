import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/providers/theme-provider";
import { queryClient, router } from "@/router";

import "@/index.css";

export default function App() {
  return (
    <>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="dark-mode">
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </StrictMode>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
