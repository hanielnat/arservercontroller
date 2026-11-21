import type { SettingsType } from "@/types/dashboard";

export const SCHEMA_VERSION = "0.0.1";
export const PORT_MIN = 1;
export const PORT_MAX = 65535;

export const DEFAULT_DASHBOARD_SETTINGS: SettingsType = {
    interface: {
        sortOrder: "descending",
        sortBy: "updated",
        groupBy: "",
    },

    queries: {
        pollingEnabled: true,
        pollingInterval: 5000,
    },
};
