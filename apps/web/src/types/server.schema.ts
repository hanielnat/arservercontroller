import * as z from "zod";

export const ServerStatusSchema = z.enum(["running", "stopped", "dead"]);

export const ServerConfigDataSchema = z.object({
    version: z.string(),
    name: z.string(),
    bindPort: z.number(),

    bindAddress: z.ipv4().optional(),
    a2sPort: z.number().optional(),
    rconPort: z.number().optional(),
    status: ServerStatusSchema.optional(),
    commandLine: z.array(z.string()).optional(),
    environment: z.union([z.record(z.string(), z.any()), z.array(z.string())]).optional(),
    extraPorts: z.array(z.record(z.string(), z.number())).optional(),
    reforgerConfig: z
        .string()
        .min(1, "Reforger config is obrigatory")
        .transform((str, ctx) => {
            try {
                return JSON.parse(str);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid JSON",
                });
                return z.NEVER;
            }
        })
        .pipe(z.json()),
});

export const ServerSchema = z.object({
    id: z.uuid(),
    name: z.string().trim(),
    version: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
    serverConfigData: z.object(ServerConfigDataSchema),
});

export const ServerOutSchema = z.object({
    createdAt: z.number(),
    updatedAt: z.number(),
    serverConfigData: ServerConfigDataSchema,
});

export const ServersOutSchema = z.object({
    data: z.array(ServerOutSchema),
    count: z.number(),
});

export const ReforgerProcessStatusOutSchema = z.object({
    pid: z.number().optional(),
    status: ServerStatusSchema,
});

export const ServerStatusOutSchema = z.object({
    container: ServerStatusSchema,
    agent: ServerStatusSchema,
    reforger: ReforgerProcessStatusOutSchema,
});

// #region Forms

export const ServerCreateSchema = z.object({
    version: z.string().min(1),
    name: z.string().min(1),
    bindPort: z.number().int().positive(),

    bindAddress: z.string().optional(),
    a2sPort: z.number().int().positive().optional(),
    rconPort: z.number().int().positive().optional(),
    status: ServerStatusSchema.optional(),

    commandLine: z.array(z.string()).optional(),
    environment: z.union([z.record(z.string(), z.any()), z.array(z.string())]).optional(),
    extraPorts: z.array(z.record(z.string(), z.number())).optional(),

    // string no form → objeto JSON validado no submit
    reforgerConfig: z
        .string()
        .min(1, "Reforger config is obrigatory")
        .superRefine((str, ctx) => {
            try {
                JSON.parse(str);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid JSON",
                });
            }
        }),
});
// export const ServerCreateSchema = ServerConfigDataSchema.omit({ version: true, status: true })
export type ServerCreateFormvalues = z.infer<typeof ServerCreateSchema>;

// #endregion
