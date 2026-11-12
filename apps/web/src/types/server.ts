import * as z from "zod";

import { SCHEMA_VERSION } from "@/lib/consts";
import {
    ReforgerProcessStatusOutSchema,
    ServerConfigCreateSchema,
    ServerConfigSchema,
    ServerConfigUpdateSchema,
    ServerCreateFormSchema,
    ServerOutSchema,
    ServerSchema,
    ServersOutSchema,
    ServerStatusEnumSchema,
    ServerStatusOutSchema,
    ServerUpdateFormSchema,
} from "@/types/server.schema";

export type ServerStatusEnum = z.infer<typeof ServerStatusEnumSchema>;

export type Server = z.infer<typeof ServerSchema>;

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// #region Forms

export type ServerCreateFormValues = z.infer<typeof ServerCreateFormSchema>;

export type ServerUpdateFormValues = z.infer<typeof ServerUpdateFormSchema>;

// #endregion

// #region ApiClient

export type ServerAction = "start" | "stop" | "restart" | "reloadConfig";

export type ServerOut = z.infer<typeof ServerOutSchema>;

export type ServersOut = z.infer<typeof ServersOutSchema>;

export type ReforgerProcessStatusOut = z.infer<typeof ReforgerProcessStatusOutSchema>;

export type ServerStatusOut = z.infer<typeof ServerStatusOutSchema>;

export type ServerConfigCreate = z.infer<typeof ServerConfigCreateSchema>;

export type ServerConfigUpdate = z.infer<typeof ServerConfigUpdateSchema>;

export function formValuesToCreatePayload(values: ServerCreateFormValues): ServerConfigCreate {
    return ServerConfigCreateSchema.parse({
        version: SCHEMA_VERSION,
        name: values.name,
        bindPort: values.bindPort,
        bindAddress: values.bindAddress ?? "0.0.0.0",
        a2sPort: values.a2sPort,
        rconPort: values.rconPort,
        commandLine: values.commandLine,
        environment: values.environment,
        extraPorts: values.extraPorts?.map((p) => [p.key, p.value] as [string, number]),
        reforgerConfig: JSON.parse(values.reforgerConfig),
    });
}

export function formValuesToUpdatePayload(values: ServerUpdateFormValues): ServerConfigUpdate {
    return ServerConfigUpdateSchema.parse({
        name: values.name,
        bindPort: values.bindPort,
        bindAddress: values.bindAddress,
        a2sPort: values.a2sPort,
        rconPort: values.rconPort,
        commandLine: values.commandLine,
        environment: values.environment,
        extraPorts: values.extraPorts?.map(({ key, value }) => [key, value] as [string, number]),
        containerId: values.containerId,
        reforgerConfig: JSON.parse(values.reforgerConfig),
    });
}

// #endregion
