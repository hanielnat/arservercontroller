import { useQuery } from "@tanstack/react-query";
import { InfoIcon, PenIcon, ServerIcon } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { CodeTextArea } from "@/components/ui/code-textarea";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { serversQueryOptions } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";
import type { ServerConfig, ServerStatusEnum } from "@/types/server";

function ServerInfoHeader({ id }: { id: string }) {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="flex flex-row items-center gap-2">
          <InfoIcon />
          <span className="text-bold text-2xl">Server Details</span>
        </span>

        {!isMobile && <span className="self-center">•</span>}

        <div className="group/id flex flex-row items-center gap-0">
          <Badge variant="outline" className="p-2">
            <span className="font-mono text-[10pt]">{id}</span>
          </Badge>
          <CopyTextButton
            size="xs"
            variant="ghost"
            value={id}
            className={cn("p-2", !isMobile ? "opacity-0 group-hover/id:opacity-100" : undefined)}
          />
        </div>
      </div>
    </div>
  );
}

function ServerInfoList({ children, className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("rounded-md border", className)} {...props}>
      {children}
    </ul>
  );
}

function ServerInfoListItem({
  keyRender,
  valueRender,
  className,
  ...props
}: {
  keyRender?: React.ReactNode;
  valueRender?: React.ReactNode;
} & React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "border-b px-4 py-3 flex flex-row items-center justify-between gap-1 w-full last:border-b-0",
        className,
      )}
      {...props}
    >
      {keyRender}
      {valueRender}
    </li>
  );
}

interface ServerInfoLayoutItem {
  label: string;
  key: ServerConfigField;
  value: ServerConfigFieldTypes;
  keyRender?: React.ReactNode;
  valueRender?: (value: ServerConfigFieldTypes) => React.ReactNode;
}

type ServerConfigField = keyof ServerConfig;

type ServerConfigFieldTypes = ServerConfig[ServerConfigField];

function valueAsRenderable(value: ServerConfigFieldTypes) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function copyableValueRender(value: ServerConfigFieldTypes) {
  return (
    <span className="flex items-center gap-1">
      <CopyTextButton size="icon-xs" value={value as string} />
      <code>{valueAsRenderable(value)}</code>
    </span>
  );
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

  const serverInfoLayout = useMemo((): ServerInfoLayoutItem[] => {
    const cfg = server?.serverConfigData;

    return [
      {
        label: "Status",
        key: "status",
        value: cfg?.status,
        valueRender: (value) => <ServerStatusBadge status={value as ServerStatusEnum} />,
      },
      {
        label: "IP Address",
        key: "bindAddress",
        value: cfg?.bindAddress,
        valueRender: copyableValueRender,
      },
      {
        label: "Bind Port",
        key: "bindPort",
        value: cfg?.bindPort,
      },
      {
        label: "A2S Port",
        key: "a2sPort",
        value: cfg?.a2sPort,
      },
      {
        label: "RCON Port",
        key: "rconPort",
        value: cfg?.rconPort,
      },
      {
        label: "Launch Options",
        key: "commandLine",
        value: cfg?.commandLine,
        valueRender: copyableValueRender,
      },
      {
        label: "Process Environment",
        key: "environment",
        value: cfg?.environment,
      },
      {
        label: "Extra Ports",
        key: "extraPorts",
        value: cfg?.extraPorts,
      },
      {
        label: "Container ID",
        key: "containerId",
        value: cfg?.containerId,
        valueRender: copyableValueRender,
      },
    ];
  }, [server?.serverConfigData]);

  return (
    <div className={cn(className)} {...props}>
      <ServerInfoHeader id={id} />

      <Card className="mt-4 w-full rounded-md p-4 align-middle md:mx-auto md:min-h-min md:flex-1">
        <CardTitle className="text-bold flex items-center gap-2 text-xl">
          <ServerIcon />
          {server?.serverConfigData.name}
          <ServerHealthIndicator
            renderBadge={true}
            id={server?.serverConfigData.id ?? ""}
            className="ml-2"
          />
        </CardTitle>

        <CardDescription>
          <code className="text-mono flex gap-1 text-sm">
            <div className="">{server?.serverConfigData.bindAddress}</div>:
            <div className="">{server?.serverConfigData.bindPort}</div>
          </code>
        </CardDescription>

        <CardContent className="flex flex-1 flex-col gap-2 p-0 sm:flex-row">
          <ServerInfoList className="bg-background/30 max-w-lg">
            {serverInfoLayout.map((entry) => (
              <ServerInfoListItem
                key={entry.key}
                keyRender={
                  !entry.keyRender ? (
                    <span className="text-muted-foreground">{entry.label}</span>
                  ) : (
                    entry.keyRender
                  )
                }
                valueRender={
                  !entry.valueRender ? (
                    <span className="font-mono">{valueAsRenderable(entry.value)}</span>
                  ) : (
                    <span>{entry.valueRender(entry.value)}</span>
                  )
                }
                className="gap-4"
              />
            ))}
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
