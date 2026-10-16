import { beforeEach, describe, expect, it } from "vitest";

import { useServersStore } from "@/stores/server";
import { type ServerOut } from "@/types/server";

const makeServer = (id: string, name = "Test server"): ServerOut => ({
    createdAt: 1,
    updatedAt: 2,
    serverConfigData: {
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
        containerId: id,
        id,
    },
});

describe("Server store", () => {
    beforeEach(() => {
        useServersStore.setState({
            servers: [],
            selectedId: null,
        });
    });

    it("starts with empty state", () => {
        const { servers, selectedId } = useServersStore.getInitialState();

        expect(servers).toEqual([]);
        expect(selectedId).toBeNull();
    });

    it("adds a server", () => {
        const server = makeServer("test-id");

        useServersStore.getState().add(server);

        const { servers } = useServersStore.getState();
        expect(servers).toHaveLength(1);
        expect(servers[0]).toEqual(server);
    });

    it("removes a server by id", () => {
        const a = makeServer("a");
        const b = makeServer("b");

        useServersStore.getState().updateStore([a, b]);
        useServersStore.getState().remove(a);

        const { servers } = useServersStore.getState();
        expect(servers).toHaveLength(1);
        expect(servers[0]?.serverConfigData.id).toBe("b");
    });

    it("replaces the whole list with updateStore", () => {
        const list = [makeServer("1"), makeServer("2")];

        useServersStore.getState().updateStore(list);

        expect(useServersStore.getState().servers).toEqual(list);
    });
});
