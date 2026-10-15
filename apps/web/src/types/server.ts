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
} from "@/types/server.schema";

export type ServerStatusEnum = z.infer<typeof ServerStatusEnumSchema>;

export type Server = z.infer<typeof ServerSchema>;

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// #region Forms

export type ServerCreateFormValues = z.infer<typeof ServerCreateFormSchema>;

// #endregion

// #region ApiClient

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

// #endregion
