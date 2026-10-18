import type { ServerConfigCreate, ServerOut } from "@/types/server";

export const mockServerCreatedSchema = (name = "Test server"): ServerConfigCreate => ({
    version: "test",
    name,
    bindPort: 2001,

    a2sPort: 17777,
    rconPort: 19999,
    bindAddress: "0.0.0.0",

    commandLine: ["-test", "command"],
    extraPorts: [["test", 4]],
    environment: { TEST: "1" },
    reforgerConfig: { place: "holder" },
});

export const mockServer = (id: string, name = "Test server"): ServerOut => ({
    createdAt: 1,
    updatedAt: 2,
    serverConfigData: {
        version: "test",
        id,
        containerId: id,
        name,
        bindPort: 2001,

        a2sPort: 17777,
        rconPort: 19999,
        status: "running",
        bindAddress: "0.0.0.0",

        commandLine: ["-test", "command"],
        extraPorts: [["test", 4]],
        environment: { TEST: "1" },
        reforgerConfig: { place: "holder" },
    },
});
