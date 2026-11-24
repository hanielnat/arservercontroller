export const serverKeys = {
    all: ["servers"] as const,

    lists: () => [...serverKeys.all, "list"] as const,

    list: (offset: number, limit: number) => [...serverKeys.lists(), { offset, limit }] as const,

    details: () => [...serverKeys.all, "detail"] as const,

    detail: (id: string) => [...serverKeys.details(), id] as const,

    status: (id: string) => [...serverKeys.all, "status", id] as const,
};
