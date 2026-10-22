import { useQuery } from "@tanstack/react-query";
import { CopyIcon, InfoIcon, PenIcon, ServerIcon } from "lucide-react";
import type React from "react";
import { useCallback, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { CodeTextArea } from "@/components/ui/code-textarea";
import { serversQueryOptions, useServerStatus } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";
import type { ServerStatusEnum } from "@/types/server";

function ServerInfoHeader({ id }: { id: string }) {
  return (
    <div className="flex align-middle">
      <div className="flex items-center gap-2">
        <InfoIcon />
        <span className="text-bold text-2xl">Server Details</span>
        <span>•</span>
        <Badge variant="outline" className="font-mono text-sm">
          {id}
        </Badge>
        <Button size="icon-xs" variant="ghost" render={<CopyIcon />} />
      </div>
    </div>
  );
}

function ServerInfoListItem({
  horizontal,
  keyRender,
  valueRender,
  className,
  ...props
}: {
  horizontal?: boolean;
  keyRender?: React.ReactElement;
  valueRender?: React.ReactElement;
} & React.ComponentProps<"li">) {
  return (
    <li className={cn("border-b px-4 py-3 last:border-b-0", className)} {...props}>
      <div
        className={cn(
          "flex w-full align-middle gap-1",
          horizontal ? "flex-row justify-between gap-8" : "flex-col",
        )}
      >
        {keyRender}
        {valueRender}
      </div>
    </li>
  );
}

function ServerInfoList({ children, className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("rounded-md border", className)} {...props}>
      {children}
    </ul>
  );
}

const SERVER_CONFIG_ORDERS = [
  "status",
  "bindAddress",
  "bindPort",
  "a2sPort",
  "rconPort",
  "commandLine",
  "environment",
  "extraPorts",
  "containerId",
] as const;

type ServerConfigKey = (typeof SERVER_CONFIG_ORDERS)[number];

const SERVER_CONFIG_LABELS: Record<ServerConfigKey, string> = {
  status: "Status",
  bindAddress: "IP Address",
  bindPort: "Bind Port",
  a2sPort: "A2S Port",
  rconPort: "RCON Port",
  commandLine: "Launch Options",
  environment: "Process Environment",
  extraPorts: "Extra Ports",
  containerId: "Container ID",
};

function getConfigLabel(key: string): string {
  const label = (SERVER_CONFIG_LABELS as Record<string, string>)[key];
  if (label) {
    return label;
  }

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function ServerStatusBadge({
  status,
  className,
  ...props
}: { status: ServerStatusEnum } & React.ComponentProps<typeof Badge>) {
  const getBgColor = () => {
    let bg;

    const destructive = "bg-destructive/10 text-destructive dark:bg-destructive/20";
    const warning = "bg-yellow-500/15 dark:bg-yellow-500/20 text-amber-700 dark:text-amber-400";

    switch (status) {
      case "created":
        bg = "bg-muted";
        break;
      case "dead":
        bg = destructive;
        break;
      case "exited":
        bg = "bg-muted";
        break;
      case "paused":
        bg = warning;
        break;
      case "removing":
        bg = destructive;
        break;
      case "restarting":
        bg = warning;
        break;
      case "running":
        bg = "bg-primary";
        break;
    }

    return bg;
  };

  return (
    <Badge className={cn("uppercase", getBgColor(), className)} {...props}>
      {String(status)}
    </Badge>
  );
}

export function ServerHealthIndicator({
  id,
  enabled = true,
  renderBadge = false,
  className,
  ...props
}: { id: string; enabled?: boolean; renderBadge?: boolean } & React.ComponentProps<typeof Badge>) {
  const { data: status } = useServerStatus(id, enabled);

  const statusToLabel = useMemo(() => {
    if (!id) {
      return "Unknown";
    }

    const m = new Map<string, boolean>([
      ["agent", status?.agent === "running"],
      ["container", status?.container === "running"],
      ["reforger", status?.reforger.status === "running"],
    ]);

    return m.get("agent") && m.get("container") && m.get("reforger") ? "Healthy" : "Unhealthy";
  }, [status, id]);

  const labelToTone = useCallback((status: string) => {
    const m = new Map<string, { pulse: string; alternate: string; badge: string }>([
      [
        "healthy",
        {
          pulse: "bg-emerald-500/60",
          alternate: "bg-emerald-500",
          badge: "bg-green-800/50",
        },
      ],
      [
        "unhealthy",
        {
          pulse: "bg-destructive/60",
          alternate: "bg-destructive",
          badge: "bg-destructive/30",
        },
      ],
      [
        "unknown",
        {
          pulse: "bg-yellow-500/60",
          alternate: "bg-yellow-500",
          badge: "bg-muted/50",
        },
      ],
    ]);

    return m.get(status.toLowerCase());
  }, []);

  const withIndicator = () => (
    <span
      className={cn("flex size-2 items-center justify-center", renderBadge ? undefined : className)}
    >
      <span
        className={cn(
          "absolute size-2 animate-ping rounded-full",
          labelToTone(statusToLabel)?.pulse,
        )}
      />
      <span className={cn("relative size-2 rounded-full", labelToTone(statusToLabel)?.alternate)} />
    </span>
  );

  const withBadge = () => (
    <Badge
      className={cn("flex items-center gap-2", labelToTone(statusToLabel)?.badge, className)}
      {...props}
    >
      {withIndicator()}
      <span className="text-xs">{statusToLabel}</span>
    </Badge>
  );

  return <>{renderBadge ? withBadge() : withIndicator()}</>;
}

export function ServerInfo({
  id,
  className,
  ...props
}: { id: string } & React.ComponentProps<"div">) {
  const { data: server } = useQuery({
    ...serversQueryOptions(),
    select: (data) => data.data.find((s) => id === s.serverConfigData.id),
  });

  const entries = useMemo(
    () =>
      Object.entries(server?.serverConfigData ?? {})
        .filter(
          ([key]) =>
            key !== "id" && key !== "name" && key !== "version" && key !== "reforgerConfig",
        )
        .sort(([keyA], [keyB]) => {
          const indexA = SERVER_CONFIG_ORDERS.indexOf(keyA as ServerConfigKey);
          const indexB = SERVER_CONFIG_ORDERS.indexOf(keyB as ServerConfigKey);

          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }

          if (indexA !== -1) {
            return -1;
          }

          if (indexB !== -1) {
            return 1;
          }

          return keyA.localeCompare(keyB);
        }),
    [server?.serverConfigData],
  );

  return (
    <div className={cn(className)} {...props}>
      <ServerInfoHeader id={id} />

      <Card className="mx-auto mt-4 w-full flex-1 rounded-md p-4 align-middle md:min-h-min">
        <CardTitle>
          <div className="text-bold flex items-center gap-2 text-xl">
            <ServerIcon />
            {server?.serverConfigData.name}
            <ServerHealthIndicator
              renderBadge={true}
              id={server?.serverConfigData.id ?? ""}
              className="ml-2"
            />
          </div>
        </CardTitle>

        <CardDescription>
          <code className="text-mono flex gap-1 text-sm hover:border-b-2">
            <div className="">{server?.serverConfigData.bindAddress}</div>:
            <div className="">{server?.serverConfigData.bindPort}</div>
          </code>
        </CardDescription>

        <CardContent className="flex flex-1 gap-2 p-0">
          <ServerInfoList className="bg-background/30">
            {entries.map(([key, value]) => {
              const horizontal = true;
              const keyRender = <span>{getConfigLabel(key)}</span>;

              switch (key) {
                case "status":
                  return (
                    <ServerInfoListItem
                      key={key}
                      horizontal={horizontal}
                      keyRender={keyRender}
                      valueRender={<ServerStatusBadge status={value as ServerStatusEnum} />}
                    />
                  );

                default:
                  return (
                    <ServerInfoListItem
                      key={key}
                      horizontal={true}
                      keyRender={<span>{getConfigLabel(key)}</span>}
                      valueRender={
                        <code>
                          {typeof value === "string"
                            ? value
                            : !Array.isArray(value)
                              ? JSON.stringify(value)
                              : value}
                        </code>
                      }
                    />
                  );
              }
            })}
          </ServerInfoList>

          <div className="flex-1">
            <CodeTextArea
              lang="json"
              value={JSON.stringify(server?.serverConfigData.reforgerConfig)}
              onChange={(value) => console.log(value)}
              minHeight="100%"
              className="h-full"
            />
          </div>
        </CardContent>

        <CardFooter className="w-full">
          <div className="flex flex-1 flex-col items-end align-middle">
            <Button>
              <PenIcon />
              Update
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
