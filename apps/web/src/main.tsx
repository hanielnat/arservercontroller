import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/hooks/providers/settings-provider";
import { ThemeProvider } from "@/hooks/providers/theme-provider";

import "@/index.css";
import { queryClient, router } from "@/router";

export default function App() {
  return (
    <>
      <StrictMode>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="dark" storageKey="dark-mode">
              <TooltipProvider>
                <RouterProvider router={router} />
              </TooltipProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </StrictMode>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
