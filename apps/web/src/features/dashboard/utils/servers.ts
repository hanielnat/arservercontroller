import { PORT_MAX, PORT_MIN, SCHEMA_VERSION } from "@/lib/consts";
import type {
    ServerAction,
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
    ServerOut,
    ServersOut,
    ServerStatusOut,
} from "@/types/server";

import { MockEventSource } from "../../../../tests/mock-eventsource";
import { MockWebSocket } from "../../../../tests/mock-websocket";

const STORAGE_KEY = "mockServers";

const withDelay = async <T>(value: T, ms = 300): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

const delay = (ms = 300): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const loadServers = (): ServerOut[] => {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveServers = (list: ServerOut[]): void => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        // ignore storage failures
    }
};

const uuid = () =>
    "xxxxyxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

const portRand = () => Math.floor(Math.random() * (PORT_MAX - PORT_MIN) + PORT_MIN);

const pidRand = () => portRand();

const randomName = (): string => {
    const adjectives = [
        "Alpha",
        "Bravo",
        "Charlie",
        "Delta",
        "Echo",
        "Foxtrot",
        "Golf",
        "Hotel",
        "India",
        "Juliet",
        "Kilo",
        "Lima",
        "Mike",
        "November",
        "Oscar",
        "Papa",
        "Quebec",
        "Romeo",
        "Sierra",
        "Tango",
        "Uniform",
        "Victor",
        "Whiskey",
        "X-ray",
        "Yankee",
        "Zulu",
    ];
    const noun = adjectives[Math.floor(Math.random() * adjectives.length)];
    const number = Math.floor(Math.random() * 100);
    return `${noun}-${number}`;
};

const ipRand = (): string => {
    const octets = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256));
    return octets.join(".");
};

let servers: ServerOut[] = loadServers();

const persist = () => saveServers(servers);

const list = async (count: number = 20): Promise<ServersOut> => {
    const times = Math.min(count, 20);

    if (servers.length === 0) {
        for (let i = 0; i < times; ++i) {
            servers.push({
                createdAt: new Date().valueOf(),
                updatedAt: new Date().valueOf(),
                serverConfigData: {
                    version: SCHEMA_VERSION,
                    id: uuid(),
                    containerId: uuid(),
                    name: randomName(),
                    bindPort: portRand(),
                    a2sPort: portRand(),
                    rconPort: portRand(),
                    bindAddress: ipRand(),
                    commandLine: ["-logLevel", "spam"],
                    environment: {
                        AGENT_DEBUG: "1",
                    },
                    extraPorts: [[i % 2 === 0 ? "tcp" : "udp", Math.floor(Math.random() * 10)]],
                    status: i % 2 === 0 ? "running" : i % 3 === 0 ? "created" : "dead",
                    reforgerConfig: {
                        place: "holder",
                    },
                },
            });
        }
        persist();
    }

    return withDelay({
        count: servers.length,
        data: servers,
    });
};

const get = async (id: string): Promise<ServerOut> =>
    withDelay(servers.filter((s) => s.serverConfigData.id === id)[0]);

const add = async (server: ServerConfigCreate): Promise<ServerConfig> => {
    const exists = servers.find((s) => s.serverConfigData.name === server.name);
    if (exists) {
        return exists.serverConfigData;
    }

    const created: ServerOut = {
        createdAt: new Date().valueOf(),
        updatedAt: new Date().valueOf(),
        serverConfigData: {
            ...server,
            id: uuid(),
            containerId: uuid(),
        },
    };
    servers = [...servers, created];
    persist();
    return withDelay(created.serverConfigData);
};

const remove = async (id: string): Promise<void> => {
    servers = servers.filter((s) => s.serverConfigData.id !== id);
    persist();
    return withDelay(undefined);
};

const update = async (id: string, toUpdate: ServerConfigUpdate): Promise<ServerOut> => {
    const sv = servers.find((s) => s.serverConfigData.id === id);
    if (!sv) {
        throw new Error("Mocked server not found");
    }

    const updated: ServerOut = {
        ...sv,
        updatedAt: new Date().valueOf(),
        serverConfigData: {
            ...sv.serverConfigData,
            ...toUpdate,
            containerId: !toUpdate.containerId ? undefined : toUpdate.containerId,
        },
    };

    servers = servers.map((s) => (s.serverConfigData.id === id ? updated : s));
    persist();
    return withDelay(updated);
};

const action = async (id: string, action: ServerAction): Promise<boolean> => {
    const sv = servers.find((s) => s.serverConfigData.id === id);
    if (!sv) return false;
    const current = sv.serverConfigData.status;
    let nextStatus = current;

    switch (action) {
        case "start":
            if (current === "running") {
                return false;
            }

            await delay(2 * 1000);
            nextStatus = "running";
            break;

        case "stop":
            if (current === "exited" || current === "dead") {
                return false;
            }

            await delay(2 * 1000);
            nextStatus = "exited";
            break;

        case "restart":
            if (current === "exited" || current === "dead") {
                return false;
            }

            await delay(2 * 1000);
            nextStatus = "restarting";
            await delay(2 * 1000);
            nextStatus = "running";
            break;

        case "reloadConfig":
            await delay(2 * 1000);
            nextStatus = "restarting";
            await delay(2 * 1000);
            nextStatus = "running";
            break;
    }

    const updated: ServerOut = {
        ...sv,
        updatedAt: new Date().valueOf(),
        serverConfigData: {
            ...sv.serverConfigData,
            status: nextStatus,
        },
    };

    servers = servers.map((server) => (server.serverConfigData.id === id ? updated : server));

    persist();
    return withDelay(true);
};

const status = async (id: string): Promise<ServerStatusOut> => {
    const sv = servers.find((s) => s.serverConfigData.id === id);
    if (!sv) {
        throw new Error("Mocked server not found");
    }

    return withDelay({
        container: sv.serverConfigData.status ?? "dead",
        agent: sv.serverConfigData.status,
        reforger: {
            pid: sv.serverConfigData.status === "running" ? pidRand() : null,
            status: sv.serverConfigData.status,
        },
    } as ServerStatusOut);
};

interface CreationLog {
    phase?: string;
    step?: string;
    message?: string;
    error?: boolean;
    final?: boolean;
}

const createLogStream = (
    url: string,
    history: string[],
    liveMessages: string[],
    limit: number,
    follow: boolean,
    formatMessage: (message: string) => string = (message) => message,
): MockEventSource => {
    const source = new MockEventSource(url);
    const historyLimit = Math.max(0, Math.floor(limit));
    const initialMessages = historyLimit > 0 ? history.slice(-historyLimit) : [];
    let historyIndex = 0;
    let liveIndex = 0;

    const sendNext = () => {
        if (source.readyState === MockEventSource.CLOSED) {
            return;
        }

        if (historyIndex < initialMessages.length) {
            source.send(formatMessage(initialMessages[historyIndex++]));
        } else if (follow) {
            source.send(formatMessage(liveMessages[liveIndex++ % liveMessages.length]));
        } else {
            source.close();
            return;
        }

        if (!follow && historyIndex >= initialMessages.length) {
            source.close();
            return;
        }

        setTimeout(sendNext, 50);
    };

    setTimeout(() => {
        if (source.readyState === MockEventSource.CLOSED) {
            return;
        }

        source.open();
        setTimeout(sendNext, 250);
    }, 100);

    return source;
};

const logStream = (id: string, limit: number, follow: boolean): MockEventSource => {
    if (servers.find((s) => id === s.serverConfigData.id)?.serverConfigData.status !== "running") {
        throw new Error("Server is not running");
    }

    return createLogStream(
        `http://mock/servers/${id}/logs/stream`,
        [
            "Agent connected to the dedicated server",
            "Dedicated server status changed to running",
            "Received heartbeat from the dedicated server",
            "Player session initialized",
        ],
        ["Agent heartbeat received", "Monitoring dedicated server process"],
        limit,
        follow,
    );
};

const containerLogStream = (
    id: string,
    limit: number,
    follow: boolean,
    showTimeStamp: boolean,
): MockEventSource =>
    createLogStream(
        `http://mock/servers/${id}/container/logs/stream`,
        [
            "Starting Arma Reforger dedicated server",
            "Loading world: Everon",
            "Network driver initialized",
            "Dedicated server ready",
        ],
        ["Dedicated server heartbeat", "Server process is running"],
        limit,
        follow,
        (message) => (showTimeStamp ? `${new Date().toISOString()} ${message}` : message),
    );

const creationLogs = (id: string): MockWebSocket => {
    const ws = new MockWebSocket(`ws://mock/creation/${id}`);

    const logs: CreationLog[] = [
        { phase: "manager", step: "start", message: `Starting creation of server '${id}'` },
        { phase: "docker", step: "prepare", message: "preparing" },
        { phase: "docker", step: "create", message: "creating" },
        { phase: "docker", step: "created", message: "created" },
        { phase: "manager", step: "agent_start", message: "Calling agent /start inside container" },
        { phase: "manager", step: "agent_started", message: "agent started" },
        { phase: "manager", step: "success", message: "Server created successfully", final: false },
        {
            phase: "manager",
            step: "preapre",
            message: "Error starting the container: Unknown error",
            error: false,
            final: true,
        },
    ];

    let index = 0;
    let openTimeout: ReturnType<typeof setTimeout> | undefined;
    let messageTimeout: ReturnType<typeof setTimeout> | undefined;

    ws.addEventListener("close", () => {
        if (openTimeout !== undefined) {
            clearTimeout(openTimeout);
        }
        if (messageTimeout !== undefined) {
            clearTimeout(messageTimeout);
        }
    });

    const sendNext = () => {
        if (ws.readyState !== MockWebSocket.OPEN) {
            return;
        }

        if (index >= logs.length) {
            ws.close();
            return;
        }

        const log = logs[index++];
        ws.send(JSON.stringify(log));

        messageTimeout = setTimeout(sendNext, 1000);
    };

    ws.addEventListener("open", () => sendNext());
    openTimeout = setTimeout(() => ws.open(), 100);

    return ws;
};

export const mockServer = {
    list,
    get,
    add,
    remove,
    update,
    action,
    status,
    logStream,
    containerLogStream,
    creationLogs,
};
