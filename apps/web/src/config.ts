const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
    WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000",
    API_V1: import.meta.env.API_V1_STR ?? "/api/v1",

    APP_NAME: "AR Server Controller",
    VERSION: "0.0.1",
} as const;

export default config;
