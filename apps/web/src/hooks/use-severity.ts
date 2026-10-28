import { useCallback } from "react";

import type { ServerStatusEnum } from "@/types/server";

type Severity = "success" | "error" | "info" | "warning" | "muted";
type SeverityType = Record<ServerStatusEnum, Severity>;

type ToneType = {
    bg: string;
    foreground: string;
    text: string;
    textForeground: string;
};

const STATUS_TO_TONE: SeverityType = {
    created: "info",
    dead: "error",
    exited: "muted",
    paused: "warning",
    removing: "warning",
    restarting: "warning",
    running: "success",
};

const SEVERITY_TO_TONE: Record<Severity, ToneType> = {
    success: {
        bg: `bg-success`,
        foreground: `bg-success-foreground`,
        text: `text-success`,
        textForeground: `text-success-foreground`,
    },
    error: {
        bg: `bg-error`,
        foreground: `bg-error-foreground`,
        text: `text-error`,
        textForeground: `text-error-foreground`,
    },
    info: {
        bg: `bg-info`,
        foreground: `bg-info-foreground`,
        text: `text-info`,
        textForeground: `text-info-foreground`,
    },
    warning: {
        bg: `bg-warning`,
        foreground: `bg-warning-foreground`,
        text: `text-warning`,
        textForeground: `text-warning-foreground`,
    },
    muted: {
        bg: `bg-muted`,
        foreground: `bg-foreground-foreground`,
        text: `text-muted`,
        textForeground: `text-muted-foreground`,
    },
};

export function useSeverity() {
    const statusToSeverity = useCallback(
        (status: ServerStatusEnum): Severity => STATUS_TO_TONE[status],
        [],
    );

    const statusToTone = useCallback(
        (status: ServerStatusEnum): ToneType => {
            const tone = statusToSeverity(status);
            return SEVERITY_TO_TONE[tone];
        },
        [statusToSeverity],
    );

    return {
        statusToSeverity,
        statusToTone,
    };
}
