import consts from "@/lib/consts";
import * as z from "zod";

export const serverConfigCreateSchema = z.object({
    name: z.string(),
    bindPort: z.int().gt(consts._PORT_MIN).lt(consts._PORT_MAX),
    bindAddress: z.nullable(z.ipv4().default("0.0.0.0")),
    a2sPort: z.nullable(z.int().gt(consts._PORT_MIN).lt(consts._PORT_MAX)),
    rconPort: z.nullable(z.int().gt(consts._PORT_MIN).lt(consts._PORT_MAX)),
    commandLine: z.nullable(z.string()),
    environment: z.nullable(z.array(z.tuple([z.string(), z.string()]))),
    extraPorts: z.nullable(z.array(z.tuple([z.string(), z.int()]))),
});

export enum ServerStatusEnum {
    dead = "dead",
    exited = "exited",
    created = "created",
    running = "running",
    paused = "paused",
    restarting = "restarting",
    removing = "removing",
}

export const serverConfigSchema = serverConfigCreateSchema.extend({
    id: z.uuidv4(),
    containerId: z.string(),
    status: z.enum(ServerStatusEnum),
});

export type ServerConfigCreate = z.output<typeof serverConfigCreateSchema>;
export type ServerConfig = z.output<typeof serverConfigSchema>;

export type Server = {
    createdAt: number;
    updatedAt: number;
    serverConfigData: ServerConfig;
};

export type ServerResponse = Server;

export interface GetServersReponse {
    count: number;
    data: ServerResponse[];
}

export interface ServerCreationLog {
    time: string;
    phase: string;
    message: string;
}
