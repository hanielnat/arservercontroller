import { useCallback } from "react";

import type { ServerStatusEnum, ServerStatusOut } from "@/types/server";

type Health = "Healthy" | "Unhealthy" | "Ignore" | "Unknown";
type HealthType = Record<ServerStatusEnum, Health>;
type CompoundStatusType = {
    container: HealthType;
    agent: HealthType;
    reforger: HealthType;
};

type HealthAsTone = {
    pulse: string;
    alternate: string;
    badge: string;
};

const STATUS_TO_HEALTH: HealthType = {
    created: "Ignore",
    dead: "Unhealthy",
    exited: "Ignore",
    paused: "Unhealthy",
    removing: "Unhealthy",
    restarting: "Unhealthy",
    running: "Healthy",
};

const COMPOUND_STATUS_TO_HEALTH: CompoundStatusType = {
    container: STATUS_TO_HEALTH,
    agent: STATUS_TO_HEALTH,
    reforger: STATUS_TO_HEALTH,
};

const HEALTH_TO_SEVERITY: Record<Health, string> = {
    Healthy: "success",
    Unhealthy: "error",
    Ignore: "muted",
    Unknown: "warning",
};

const HEALTH_TO_TONE: Record<Health, { pulse: string; alternate: string; badge: string }> = {
    Healthy: {
        pulse: "bg-success-foreground/50",
        alternate: "bg-success-foreground/80",
        badge: "bg-success/80 text-success-foreground",
    },
    Unhealthy: {
        pulse: "bg-error-foreground/50",
        alternate: "bg-error-foreground/80",
        badge: "bg-error/80 text-error-foreground",
    },
    Ignore: {
        pulse: "bg-muted-foreground/50",
        alternate: "bg-muted-foreground/80",
        badge: "bg-muted/80 text-muted-foreground",
    },
    Unknown: {
        pulse: "bg-warning-foreground/50",
        alternate: "bg-warning-foreground/80",
        badge: "bg-warning/80 text-warning-foreground",
    },
};

export function useHealth() {
    const statusToHealth = useCallback(
        (status: ServerStatusEnum): Health => STATUS_TO_HEALTH[status],
        [],
    );

    const compoundStatusToHealth = useCallback(
        (resource: keyof ServerStatusOut, status: ServerStatusEnum) => {
            return COMPOUND_STATUS_TO_HEALTH[resource][status];
        },
        [],
    );

    const statusToHealthTone = useCallback(
        (status: ServerStatusEnum): HealthAsTone => {
            const tone = statusToHealth(status);
            return HEALTH_TO_TONE[tone];
        },
        [statusToHealth],
    );

    const compoundStatusToHealthTone = useCallback(
        (status: ServerStatusOut): HealthAsTone => {
            const containerHealth = compoundStatusToHealth("container", status.container);
            const agentHealth = compoundStatusToHealth("agent", status.agent);
            const reforgerHealth = compoundStatusToHealth("reforger", status.reforger.status);

            const overallHealth: Health =
                containerHealth === "Unhealthy" ||
                agentHealth === "Unhealthy" ||
                reforgerHealth === "Unhealthy"
                    ? "Unhealthy"
                    : status.container === "running" &&
                        status.agent === "running" &&
                        status.reforger.status === "running"
                      ? "Healthy"
                      : "Ignore";

            return HEALTH_TO_TONE[overallHealth];
        },
        [compoundStatusToHealth],
    );

    const compoundStatusToOverallHealth = useCallback(
        (status: ServerStatusOut): Health => {
            const containerHealth = compoundStatusToHealth("container", status.container);
            const agentHealth = compoundStatusToHealth("agent", status.agent);
            const reforgerHealth = compoundStatusToHealth("reforger", status.reforger.status);

            if (
                containerHealth === "Unhealthy" ||
                agentHealth === "Unhealthy" ||
                reforgerHealth === "Unhealthy"
            ) {
                return "Unhealthy";
            }

            if (
                status.container === "running" &&
                status.agent === "running" &&
                status.reforger.status === "running"
            ) {
                return "Healthy";
            }

            return "Ignore";
        },
        [compoundStatusToHealth],
    );

    const compoundStatusToSeverity = useCallback(
        (resource: keyof ServerStatusOut, status: ServerStatusEnum) => {
            const health = compoundStatusToHealth(resource, status);
            return HEALTH_TO_SEVERITY[health];
        },
        [compoundStatusToHealth],
    );

    return {
        statusToHealth,
        compoundStatusToHealth,
        statusToHealthTone,
        compoundStatusToHealthTone,
        compoundStatusToOverallHealth,
        compoundStatusToSeverity,
    };
}
