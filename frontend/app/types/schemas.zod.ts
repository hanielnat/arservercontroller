import { z } from "zod"
import { SERVER_SCHEMA_VERSION } from "~/lib/constants"

const _userRoleEnum = ["user", "admin", "moderator"] as const
export const UserRoleSchema = z.enum(_userRoleEnum)

const _serverStatusEnum = [
    "running",
    "created",
    "exited",
    "paused",
    "restarting",
    "removing",
    "dead",
] as const
export const ServerStatusSchema = z.enum(_serverStatusEnum)

const _PORT_MAX: number = 65535
const _PORT_MIN: number = 0

export const ServerConfigBaseSchema = z.object({
    version: z.literal(SERVER_SCHEMA_VERSION),

    name: z.string(),

    bindPort: z.int()
        .lt(_PORT_MAX)
        .gt(_PORT_MIN)
        .default(2001),

    bindAddress: z.nullable(
        z.ipv4().default("0.0.0.0")
    ),

    a2sPort: z.int()
        .lt(_PORT_MAX)
        .gt(_PORT_MIN)
        .default(17777),

    rconPort: z.int()
        .lt(_PORT_MAX)
        .gt(_PORT_MIN)
        .default(19999),

    status: ServerStatusSchema
        .default(ServerStatusSchema.enum.dead),

    commandLine: z.nullable(
        z.union([z.array(z.string()), z.string()])
    ).default(null),

    arserverProfilePath: z.nullable(
        z.string()
    ).default(null),

    arserverConfigPath: z.nullable(
        z.string()
    ).default(null),
})

export const ServerConfigCreateSchema = z.object({
    ...ServerConfigBaseSchema.shape,

    status: ServerStatusSchema
        .default(ServerStatusSchema.enum.created)
})

export const ServerConfigUpdateSchema = z.object({
    ...ServerConfigBaseSchema.shape,

    containerId: z.nullable(
        z.string()
    ).default(null),

    name: z.nullable(
        z.string()
    ).default(null),

    bindPort: z.nullable(
        z.int()
            .lt(_PORT_MAX)
            .gt(_PORT_MIN)
    ).default(null),

    bindAddress: z.nullable(
        z.ipv4()
    ).default(null),

    a2sPort: z.nullable(
        z.int()
            .lt(_PORT_MAX)
            .gt(_PORT_MIN)
    ).default(null),

    rconPort: z.nullable(
        z.int()
            .lt(_PORT_MAX)
            .gt(_PORT_MIN)
    ).default(null),

    status: z.nullable(
        ServerStatusSchema
    ).default(null)
})

export const ServerConfigSchema = z.object({
    ...ServerConfigBaseSchema,

    id: z.uuidv4(),

    containerId: z.string()
})

export const ServersInSchema = z.object({
    data: z.array(ServerConfigSchema),
    count: z.int()
})

export const UserBaseSchema = z.object({
    email: z.email(),
    role: z.string()
})

export const UserUpdateSchema = z.object({
    ...UserBaseSchema,
    password: z.string()
})

export const UserRegisterSchema = z.object(
    UserUpdateSchema
)

export const UserOutSchema = z.object({
    ...UserBaseSchema,
    id: z.int()
})

export const UsersOutSchema = z.object({
    data: z.array(UserOutSchema),
    cout: z.int()
})
