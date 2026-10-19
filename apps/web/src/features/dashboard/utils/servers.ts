import { PORT_MAX, PORT_MIN, SCHEMA_VERSION } from "@/lib/consts";
import type { ServerConfigCreate, ServerConfigUpdate, ServerOut, ServersOut } from "@/types/server";

const withDelay = async <T>(value: T, ms = 300): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

const delay = (ms = 300): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const uuid = () =>
    "xxxxyxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

const portRand = () => Math.floor(Math.random() * (PORT_MAX - PORT_MIN) + PORT_MIN);

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

let servers: ServerOut[] = [];
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
    }

    return withDelay({
        count: servers.length,
        data: servers,
    });
};

const get = async (id: string): Promise<ServerOut> =>
    withDelay(servers.filter((s) => s.serverConfigData.id === id)[0]);

const add = async (server: ServerConfigCreate): Promise<void> => {
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
    return withDelay(undefined);
};

const remove = async (id: string): Promise<void> => {
    servers = servers.filter((s) => s.serverConfigData.id !== id);
    return withDelay(undefined);
};

const update = async (id: string, toUpdate: ServerConfigUpdate): Promise<boolean> => {
    const sv = servers.find((s) => s.serverConfigData.id === id);
    if (!sv) return false;

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
    return withDelay(true);
};

const action = async (
    id: string,
    action: "start" | "stop" | "restart" | "reloadConfig",
): Promise<boolean> => {
    const sv = servers.find((s) => s.serverConfigData.id === id);
    if (!sv) return false;

    switch (action) {
        case "start":
            sv.serverConfigData.status = "running";
            await delay(1 * 1000);
            break;

        case "stop":
            sv.serverConfigData.status = "exited";
            await delay(1 * 1000);
            break;

        case "restart":
            sv.serverConfigData.status = "restarting";
            await delay(2 * 1000);
            sv.serverConfigData.status = "running";
            break;

        case "reloadConfig":
            sv.serverConfigData.status = "restarting";
            await delay(2 * 1000);
            sv.serverConfigData.status = "running";
            break;
    }

    return withDelay(true);
};

export const mockServer = {
    randomUuid: uuid,
    randomName: randomName,
    randomPort: portRand,
    randomIpv4: ipRand,

    list,
    get,
    add,
    remove,
    update,
    action,
};
