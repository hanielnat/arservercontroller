import { PORT_MAX, PORT_MIN, SCHEMA_VERSION } from "@/lib/consts";
import type { ServerOut } from "@/types/server";

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
const getServers = (count: number = 20): ServerOut[] => {
    const times = Math.min(count, 20);

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

    return servers;
};

const getServer = (id: string): ServerOut => servers.filter((s) => s.serverConfigData.id === id)[0];

const addServer = (sv: ServerOut): void => {
    servers = [...servers, sv];
};

const deleteServer = (id: string): void => {
    servers.filter((s) => s.serverConfigData.id !== id);
};

export const mockServer = {
    randomUuid: uuid,
    randomName: randomName,
    randomPort: portRand,
    randomIpv4: ipRand,

    getServers,
    getServer,
    addServer,
    deleteServer,
};
