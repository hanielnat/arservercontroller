import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/providers/theme-provider";
import { PORT_MAX, PORT_MIN, SCHEMA_VERSION } from "@/lib/consts";

import "@/index.css";
import { queryClient, router } from "@/router";
import { useServersStore } from "@/stores/server";
import type { ServerOut } from "@/types/server";

const uuid = () =>
  "xxxxyxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const portRand = () => Math.floor(Math.random() * (PORT_MAX - PORT_MIN) + PORT_MIN);

const randomName = (): string => {
  const adjectives = [
    "Alpha",
    "Bravo",
    "Charlie",
    "Delta",
    "Echo",
    "Foxtrot",
    "Golf",
    "Hotel",
    "India",
    "Juliet",
    "Kilo",
    "Lima",
    "Mike",
    "November",
    "Oscar",
    "Papa",
    "Quebec",
    "Romeo",
    "Sierra",
    "Tango",
    "Uniform",
    "Victor",
    "Whiskey",
    "X-ray",
    "Yankee",
    "Zulu",
  ];
  const noun = adjectives[Math.floor(Math.random() * adjectives.length)];
  const number = Math.floor(Math.random() * 100);
  return `${noun}-${number}`;
};

const ipRand = (): string => {
  const octets = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256));
  return octets.join(".");
};

const serversCount = 20;
let servers: ServerOut[] = [];
for (let i = 0; i < serversCount; ++i) {
  servers.push({
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
    serverConfigData: {
      version: SCHEMA_VERSION,
      id: uuid(),
      containerId: uuid(),
      name: randomName(),
      bindPort: portRand(),
      a2sPort: portRand(),
      rconPort: portRand(),
      bindAddress: ipRand(),
      commandLine: ["-logLevel", "spam"],
      environment: {
        AGENT_DEBUG: "1",
      },
      extraPorts: [[i % 2 === 0 ? "tcp" : "udp", Math.floor(Math.random() * 10)]],
      status: i % 2 === 0 ? "running" : i % 3 === 0 ? "created" : "dead",
      reforgerConfig: {
        test: "test",
      },
    },
  });
}

useServersStore.getState().updateStore(servers);

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
