import * as z from "zod";

import {
    ReforgerProcessStatusOutSchema,
    ServerConfigDataSchema,
    ServerCreateSchema,
    ServerOutSchema,
    ServerSchema,
    ServersOutSchema,
    ServerStatusOutSchema,
    ServerStatusSchema,
} from "@/types/server.schema";

export type ServerStatus = z.infer<typeof ServerStatusSchema>;

export type Server = z.infer<typeof ServerSchema>;

export type ServerConfigData = z.infer<typeof ServerConfigDataSchema>;

export type ServerOut = z.infer<typeof ServerOutSchema>;

export type ServersOut = z.infer<typeof ServersOutSchema>;

export type ReforgerProcessStatusOut = z.infer<typeof ReforgerProcessStatusOutSchema>;

export type ServerStatusOut = z.infer<typeof ServerStatusOutSchema>;

// #region Forms

export type ServerCreate = z.infer<typeof ServerCreateSchema>;

// #endregion
