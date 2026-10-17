import type { ServerOut } from "@/types/server";

export const makeServer = (id: string, name = "Test server"): ServerOut => {
    return {
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
    };
};
