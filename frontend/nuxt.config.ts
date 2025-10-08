// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        "@nuxt/eslint",
        "@nuxt/ui",
        "@vueuse/nuxt"
    ],

    devtools: {
        enabled: true
    },

    ssr: true,
    nitro: {
        preset: "static"
    },

    css: ["~/assets/css/main.css"],

    routeRules: {
        "/api/**": {
            cors: true
        }
    },

    compatibilityDate: "2024-07-11",

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
})
