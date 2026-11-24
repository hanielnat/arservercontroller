import type { MockEventSource } from "../../tests/mock-eventsource";
import type { MockWebSocket } from "../../tests/mock-websocket";

export interface Crumb {
    label: string;
    to?: string;
}

export type WebSocketLike = WebSocket | MockWebSocket;
export type EventSourceLike = EventSource | MockEventSource;

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
