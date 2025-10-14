// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        "@nuxt/eslint",
        "@nuxt/ui",
        "@vueuse/nuxt",
        // "@compodium/nuxt",
    ],

    ssr: false,

    devtools: {
        enabled: false
    },

    css: ["~/assets/css/main.css"],

    routeRules: {
        "/api/**": {
            cors: true
        }
    },

    compatibilityDate: "2024-07-11",
    nitro: {
        preset: "static"
    },

    vite: {
        optimizeDeps: {
            include: [
                // "@nuxt/ui",
                "@unovis/ts",
                "@unovis/vue",
                "@vueuse/nuxt",
                "@internationalized/date",
                "date-fns",
                "zod"
            ]
        }
    },

    eslint: {
        config: {
            stylistic: {
                indent: 4,
                quotes: "double",
                braceStyle: "allman",
                commaDangle: "only-multiline",
                severity: "warn"
            }
        }
    },

    vueuse: {
        autoImports: false
    },
})
