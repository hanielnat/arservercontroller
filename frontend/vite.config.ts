import tailwindcss from "@tailwindcss/vite";
import { DevTools } from "@vitejs/devtools";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import { defineConfig } from "vite";
import VueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
    plugins: [VueDevTools(), vue(), DevTools(), tailwindcss()],
    appType: "spa",
    dev: { sourcemap: true },
    resolve: {
        alias: {
            "@": path.resolve("./src"),
        },
    },
    build: {
        sourcemap: true,
        rolldownOptions: {
            devtools: {},
        },
    },
});
