export interface Crumb {
    label: string;
    to?: string;
}

export type SortByOption = "updated" | "created" | "name";
export type SortingOrder = "descending" | "ascending";
export type GroupByOption = "" | "status";

export type SettingsType = {
    interface: {
        sortBy: SortByOption;
        sortOrder: SortingOrder;
        groupBy: GroupByOption;
        maxServersShown: number;
        maxSidebarServersShown: number;
    };

    queries: {
        pollingEnabled: boolean;
        pollingInterval: number;
    };
};
