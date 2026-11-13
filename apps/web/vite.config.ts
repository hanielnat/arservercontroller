import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type UserConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, path.resolve("..", ".."), "") };
    const HOST = `http://${process.env["HOST"] ?? "0.0.0.0"}`;
    const PORT = process.env["PORT"] ?? "8000";

    return {
        plugins: [
            tanstackRouter({
                target: "react",
                autoCodeSplitting: true,
                semicolons: false,
            }),
            react({
                compiler: true,
            }),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "src"),
            },
        },
        server: {
            proxy: {
                "/api/v1": `${HOST}:${PORT}`,
            },
        },
    } satisfies UserConfig;
});
