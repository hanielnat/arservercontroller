import * as z from "zod";

export const SERVER_SCHEMA_VERRSION: string = "0.0.1"

export const ServerStatusEnumSchema = z.enum(["running", "created", "exited", "paused", "restarting", "removing", "dead"])

export const ServerConfigBaseSchema = z.object({
    version: z.string(),
    name: z.string(),
    bind_port: z.int(),
    bind_address: z.ipv4(),
    a2s_port: z.int(),
    rcon_port: z.int(),
    status: ServerStatusEnumSchema,
    command_line: z.string(),
    arserver_profile_path: z.string(),
    arserver_config_path: z.string(),
})

export const ServerConfigUpdateSchema = z.object({
    version: z.nullable(z.string()),
    container_id: z.nullable(z.string()),
    name: z.nullable(z.string()),
    bind_port: z.nullable(z.string()),
    bind_address: z.nullable(z.ipv4()),
    a2s_port: z.nullable(z.string()),
    rcon_port: z.nullable(z.string()),
    status: ServerStatusEnumSchema,
    command_line: z.nullable(z.string()),
})

export const ServerConfigSchema = ServerConfigBaseSchema.extend({
    id: z.uuidv4(),
    container_id: z.string(),
})

export type ServerConfig = z.infer<typeof ServerConfigSchema>;