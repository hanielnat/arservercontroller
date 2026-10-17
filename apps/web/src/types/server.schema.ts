import * as z from "zod";

import { PORT_MAX, PORT_MIN } from "@/lib/consts";

export const ServerStatusEnumSchema = z.enum([
    "running",
    "created",
    "exited",
    "paused",
    "restarting",
    "removing",
    "dead",
]);

const versionSchema = z.string().min(3).default("0.1");

const nameSchema = z.string().min(4).max(20).trim();

const portSchema = z.int().gt(PORT_MIN).lt(PORT_MAX);

/** extraPorts list[tuple[str, int]] */
export const ExtraPortSchema = z.tuple([z.string(), z.int().positive()]);

/** environment: dict[str, str] | list[str] */
export const EnvironmentSchema = z.union([z.record(z.string(), z.string()), z.array(z.string())]);

export const ReforgerProcessStatusOutSchema = z.object({
    pid: z.int().positive().nullable(),
    status: ServerStatusEnumSchema,
});

export const ServerStatusOutSchema = z.object({
    container: ServerStatusEnumSchema,
    agent: ServerStatusEnumSchema,
    reforger: ReforgerProcessStatusOutSchema,
});

export const ServerConfigSchema = z.object({
    version: versionSchema,
    id: z.uuid(),
    containerId: z.string().optional(),

    name: nameSchema,
    bindPort: portSchema,
    bindAddress: z.ipv4().optional().nullable(),
    a2sPort: portSchema.optional().nullable(),
    rconPort: portSchema.optional().nullable(),

    status: ServerStatusEnumSchema.optional(),

    commandLine: z.array(z.string()).optional().nullable(),
    environment: EnvironmentSchema.optional().nullable(),
    extraPorts: z.array(ExtraPortSchema).optional().nullable(),
    reforgerConfig: z.record(z.string(), z.unknown()),
});

export const ServerSchema = z.object({
    id: z.uuid(),
    name: nameSchema,
    version: versionSchema,
    createdAt: z.number(),
    updatedAt: z.number(),
    serverConfigData: ServerConfigSchema,
});

export const ServerOutSchema = z.object({
    createdAt: z.int(),
    updatedAt: z.int(),
    serverConfigData: ServerConfigSchema,
});

export const ServersOutSchema = z.object({
    data: z.array(ServerOutSchema),
    count: z.int(),
});

// #region Forms

export const ExtraPortFormItemSchema = z.object({
    key: z.string().min(1),
    value: z.int().gt(PORT_MIN).lt(PORT_MAX),
});

export const ServerCreateFormSchema = z.object({
    name: nameSchema,
    bindPort: portSchema,
    bindAddress: z.string().optional(),
    a2sPort: portSchema.optional(),
    rconPort: portSchema.optional(),

    status: ServerStatusEnumSchema.optional(),

    commandLine: z.array(z.string()).optional(),
    environment: z.union([z.record(z.string(), z.any()), z.array(z.string())]).optional(),
    extraPorts: z.array(ExtraPortFormItemSchema).optional(),
    reforgerConfig: z
        .string()
        .min(1, "Reforger config is obrigatory")
        .superRefine((str, ctx) => {
            try {
                JSON.parse(str);
            } catch {
                ctx.addIssue({ code: "custom", message: "Invalid JSON" });
            }
        }),
});

// #endregion

// #region ApiClient

export const ServerConfigCreateSchema = z.object({
    version: versionSchema,

    name: nameSchema,
    bindPort: portSchema,
    bindAddress: z.ipv4().optional().nullable(),
    a2sPort: portSchema.optional().nullable(),
    rconPort: portSchema.optional().nullable(),

    commandLine: z.array(z.string()).optional().nullable(),
    environment: EnvironmentSchema.optional().nullable(),
    extraPorts: z.array(ExtraPortSchema).optional().nullable(),
    reforgerConfig: z.record(z.string(), z.unknown()),
});

export const ServerConfigUpdateSchema = ServerConfigCreateSchema.partial().extend({
    containerId: z.string().optional().nullable(),
    reforgerConfig: z.record(z.string(), z.unknown()),
});

// #endregion
