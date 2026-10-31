import type { MockWebSocket } from "../../tests/mock-websocket";

export interface Crumb {
    label: string;
    to?: string;
}

export type WebSocketLike = WebSocket | MockWebSocket;
