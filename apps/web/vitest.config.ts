import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default defineConfig((configEnv) =>
    mergeConfig(
        viteConfig(configEnv),
        defineConfig({
            test: {
                environment: "node",
                setupFiles: ["./tests/__setup.ts"],
                globals: false,
            },
        }),
    ),
);
