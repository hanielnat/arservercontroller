import { create, type ExtractState, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

import { type ServerOut } from "@/types/server";

interface State<S> {
    servers: S[];
    selectedId: string | null;
}

interface Action<S> {
    add: (server: S) => void;
    remove: (server: S) => void;
    updateStore: (servers: S[]) => void;
}

type ServerStore = State<ServerOut> & Action<ServerOut>;

export const serverStoreCreator: StateCreator<ServerStore> = (set) => ({
    servers: [],
    selectedId: null,

    add: (server) => set((state) => ({ servers: [...state.servers, server] })),

    remove: (toRemove) =>
        set((state) => ({
            servers: state.servers.filter(
                (sv) => sv.serverConfigData.id !== toRemove.serverConfigData.id,
            ),
        })),

    updateStore: (servers) => set({ servers }),
});

export const useServersStore = create<ServerStore>()(devtools(serverStoreCreator));

export type ServerState = ExtractState<typeof useServersStore>;
