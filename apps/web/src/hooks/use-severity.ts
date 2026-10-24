import { useCallback } from "react";

import type { ServerStatusEnum } from "@/types/server";

type Severity = "success" | "error" | "info" | "warning" | "muted";
type SeverityType = Record<ServerStatusEnum, Severity>;

const STATUS_TO_TONE: SeverityType = {
    created: "info",
    dead: "error",
    exited: "muted",
    paused: "warning",
    removing: "warning",
    restarting: "warning",
    running: "success",
};

export function useSeverity() {
    const statusToSeverity = useCallback(
        (status: ServerStatusEnum): Severity => STATUS_TO_TONE[status],
        [],
    );

    const statusToTone = useCallback(
        (status: ServerStatusEnum) => {
            const tone = statusToSeverity(status);
            return {
                bg: `bg-${tone}`,
                foreground: `bg-${tone}-foreground`,
                text: `text-${tone}`,
                textForeground: `text-${tone}-foreground`,
            };
        },
        [statusToSeverity],
    );

    return {
        statusToSeverity,
        statusToTone,
    };
}
