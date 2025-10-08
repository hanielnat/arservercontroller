import type {

    UserRoleSchema,
    ServerStatusSchema,
    ServerConfigBaseSchema,
    ServerConfigCreateSchema,
    ServerConfigUpdateSchema,
    // ServerConfigSchema,
    ServersInSchema,
    UserBaseSchema,
    UserUpdateSchema,
    UserRegisterSchema,
    UserOutSchema,
    UsersOutSchema
} from "~/types/schemas.zod"

export type UserStatus = "subscribed" | "unsubscribed" | "bounced"
export type SaleStatus = "paid" | "failed" | "refunded"
export type UserRoleEnum = z.infer<typeof UserRoleSchema>

const _rolePermissionsMap = new Map<string, string[]>([
    [UserRoleSchema.enum.user, [
        "create",
        "delete",
        "update",
        "view",
        "start",
        "stop",
        "restart"
    ]],

    [UserRoleSchema.enum.admin, [
        "update",
        "view",
        "start",
        "stop",
        "restart"
    ]],

    [UserRoleSchema.enum.moderator, [
        "view"
    ]]
])

export type RolePermissionsMap = typeof _rolePermissionsMap
export const RolePermissions: RolePermissionsMap = _rolePermissionsMap

export type ServerStatus = z.infer<typeof ServerStatusSchema>

export type ServerConfigBase = z.infer<typeof ServerConfigBaseSchema>
export type ServerConfigCreate = z.infer<typeof ServerConfigCreateSchema>
export type ServerConfigUpdate = z.infer<typeof ServerConfigUpdateSchema>

// export type ServerConfig = z.infer<typeof ServerConfigSchema>
export interface ServerConfig {
    version: string
    name: string
    bindPort: number
    bindAddress?: string
    a2sPort: number
    rconPort: number
    status: "running"
        | "created"
        | "exited"
        | "paused"
        | "restarting"
        | "removing"
        | "dead"
    commandLine?: string
    arserverProfilePath?: string
    arserverConfigPath?: string
    id: string
    containerId: string
}

export type ServersIn = z.infer<typeof ServersInSchema>

export type UserBase = z.infer<typeof UserBaseSchema>
export type UserUpdate = z.infer<typeof UserUpdateSchema>
export type UserRegister = z.infer<typeof UserRegisterSchema>
export type UserOut = z.infer<typeof UserOutSchema>
export type UsersOut = z.infer<typeof UsersOutSchema>

export interface Notification {
    id: number
    unread?: boolean
    sender: User
    body: string
    date: string
}

export type Period = "daily" | "weekly" | "monthly"

export interface Range {
    start: Date
    end: Date
}

/*
export interface User {
    id: number
    name: string
    email: string
    role: UserRoleEnum
    avatar?: AvatarProps
    status: UserStatus
    location: string
}

export interface Mail {
    id: number
    unread?: boolean
    from: User
    subject: string
    body: string
    date: string
}

export interface Member {
    name: string
    username: string
    role: "member" | "owner"
    avatar: AvatarProps
}

export interface Stat {
    title: string
    icon: string
    value: number | string
    variation: number
    formatter?: (value: number) => string
}

export interface Sale {
    id: string
    date: string
    status: SaleStatus
    email: string
    amount: number
}
*/
