import { useMutationState } from "@tanstack/react-query";
import * as React from "react";

import { toast } from "@/components/ui/toast";

interface ServerOperation {
  mutationId: number;
  label: string;
  serverId?: string;
  status: "pending" | "success" | "error";
  error?: Error | null;
}

const STATUSES = ["pending", "success", "error"] as const;

export function PendingServerOperations() {
  const toastedStatuses = React.useRef(new Map<number, string>());

  const operations = useMutationState({
    filters: {
      mutationKey: ["server-operation"],
      predicate: (mutation) => STATUSES.some((s) => mutation.state.status === s),
    },

    select: (mutation) => {
      const variables = mutation.state.variables as { id?: string; action?: string } | undefined;
      const kind = mutation.options.mutationKey?.[1] as string;
      const status = mutation.state.status as ServerOperation["status"];

      const actionLabels: Record<string, Record<ServerOperation["status"], string>> = {
        start: { pending: "Starting server", success: "Server started", error: "Start failed" },
        stop: { pending: "Stopping server", success: "Server stopped", error: "Stop failed" },
        restart: {
          pending: "Restarting server",
          success: "Server restarted",
          error: "Restart failed",
        },
        reloadConfig: {
          pending: "Reloading server config",
          success: "Server config reloaded",
          error: "Config reload failed",
        },
      };

      const otherLabels: Record<string, Record<ServerOperation["status"], string>> = {
        remove: {
          pending: "Deleting server",
          success: "Server deleted",
          error: "Delete failed",
        },
        add: {
          pending: "Creating server",
          success: "Server created",
          error: "Create failed",
        },
        update: {
          pending: "Updating server",
          success: "Server updated",
          error: "Update failed",
        },
      };

      return {
        mutationId: mutation.mutationId,
        label:
          kind === "action"
            ? (actionLabels[variables?.action ?? ""]?.[status] ?? "Server operation")
            : (otherLabels[kind]?.[status] ?? "Server operation"),
        serverId: variables?.id,
        status,
        error: status === "error" ? mutation.state.error : null,
      } as ServerOperation;
    },
  });

  React.useEffect(() => {
    const activeMutationIds = new Set(operations.map((operation) => operation.mutationId));

    for (const operation of operations) {
      if (toastedStatuses.current.get(operation.mutationId) === operation.status) {
        continue;
      }

      toastedStatuses.current.set(operation.mutationId, operation.status);
      toast.add({
        id: `server-operation-${operation.mutationId}`,
        type: operation.status === "pending" ? "loading" : operation.status,
        title: operation.label,
        description:
          operation.error?.message ??
          (operation.serverId ? `Server ${operation.serverId.slice(0, 8)}` : undefined),
        timeout: operation.status === "pending" ? 0 : 3000,
      });
    }

    for (const mutationId of toastedStatuses.current.keys()) {
      if (!activeMutationIds.has(mutationId)) {
        toastedStatuses.current.delete(mutationId);
      }
    }
  }, [operations]);

  return null;
}
