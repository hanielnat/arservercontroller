import {
  CableIcon,
  ContainerIcon,
  HeartIcon,
  NetworkIcon,
  RadioIcon,
  TerminalIcon,
  VariableIcon,
  WifiIcon,
  type LucideIcon,
} from "lucide-react";
import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { CodeTextArea } from "@/components/ui/code-textarea";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import { cn } from "@/lib/utils";
import type { ServerConfig, ServerStatusEnum } from "@/types/server";

interface ServerProperty {
  label: React.ReactNode;
  key: keyof ServerConfig;
  value: ServerConfig[keyof ServerConfig] | undefined;
  valueRender?: (value: ServerConfig[keyof ServerConfig] | undefined) => React.ReactNode;
}

function valueToString(value: ServerConfig[keyof ServerConfig] | undefined) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function valueAsRenderable(value: ServerConfig[keyof ServerConfig] | undefined): React.ReactNode {
  if (value === undefined || value === null) {
    return <Badge variant="muted">Not set</Badge>;
  }

  if (typeof value !== "object" || typeof value === "string") {
    return <code className="font-mono">{valueToString(value)}</code>;
  }

  return (
    <pre className="bg-muted max-h-32 w-full min-w-0 overflow-auto rounded p-2 text-xs sm:max-w-[60%]">
      <code className="font-mono">{valueToString(value)}</code>
    </pre>
  );
}

function labelIconRender(label: string, Icon: LucideIcon) {
  return (
    <span className="flex shrink-0 items-center gap-1 overflow-hidden">
      <Icon size={16} className="text-muted-foreground" />
      {label}
    </span>
  );
}

function copyableValueRender(value: ServerConfig[keyof ServerConfig] | undefined) {
  if (typeof value !== "object") {
    return (
      <span className="flex flex-row items-center gap-1">
        <CopyTextButton size="icon-xs" value={valueToString(value)} />
        <code className="font-mono">{valueToString(value)}</code>
      </span>
    );
  }

  return (
    <span className="flex w-full min-w-0 flex-row items-start gap-1 sm:max-w-[60%]">
      <CopyTextButton size="icon-xs" value={valueToString(value)} />
      <pre className="bg-muted/50 border-input max-h-32 min-w-0 flex-1 overflow-auto rounded-md border p-1.5 text-xs whitespace-pre">
        <code className="font-mono">{valueToString(value)}</code>
      </pre>
    </span>
  );
}

function ServerPropertyListItem({ label, value, valueRender }: Omit<ServerProperty, "key">) {
  return (
    <li className="flex min-h-16 w-full min-w-0 shrink-0 flex-col justify-between gap-4 border-b py-2 last:border-b-0 sm:flex-row sm:items-center">
      {label}
      {valueRender ? valueRender(value) : valueAsRenderable(value)}
    </li>
  );
}

export function ServerProperties({
  config,
  className,
}: {
  config?: ServerConfig;
  className?: string;
}) {
  const properties = useMemo((): ServerProperty[] => {
    return [
      {
        label: labelIconRender("Container Status", WifiIcon),
        key: "status",
        value: config?.status,
        valueRender: (value) =>
          value ? (
            <ServerStatusBadge status={value as ServerStatusEnum} />
          ) : (
            valueAsRenderable(value)
          ),
      },
      {
        label: labelIconRender("IP Address (IPv4)", NetworkIcon),
        key: "bindAddress",
        value: config?.bindAddress,
        valueRender: copyableValueRender,
      },
      {
        label: labelIconRender("Bind Port (UDP)", RadioIcon),
        key: "bindPort",
        value: config?.bindPort,
      },
      {
        label: labelIconRender("A2S Port (UDP)", RadioIcon),
        key: "a2sPort",
        value: config?.a2sPort,
      },
      {
        label: labelIconRender("RCON Port (UDP)", RadioIcon),
        key: "rconPort",
        value: config?.rconPort,
      },
      {
        label: labelIconRender("Launch Options", TerminalIcon),
        key: "commandLine",
        value: config?.commandLine,
        valueRender: copyableValueRender,
      },
      {
        label: labelIconRender("Process Environment", VariableIcon),
        key: "environment",
        value: config?.environment,
        valueRender: copyableValueRender,
      },
      {
        label: labelIconRender("Extra Ports", CableIcon),
        key: "extraPorts",
        value: config?.extraPorts,
      },
      {
        label: labelIconRender("Container ID", ContainerIcon),
        key: "containerId",
        value: config?.containerId,
        valueRender: copyableValueRender,
      },
    ];
  }, [config]);

  return (
    <div className={cn("flex flex-1 h-full flex-col gap-4 p-0 sm:flex-row ", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-4">
        <span className="text-[14px]">Server details</span>

        <ul className="flex min-w-0 flex-1 flex-col items-center">
          <ServerPropertyListItem
            label={labelIconRender("Server Health", HeartIcon)}
            value={null}
            valueRender={() => <ServerHealthIndicator id={config?.id} renderBadge={true} />}
          />

          {properties.map(({ key, ...property }) => (
            <ServerPropertyListItem key={key} {...property} />
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-4">
        <span className="text-[14px]">Current server configuration</span>

        <CodeTextArea
          value={JSON.stringify(config?.reforgerConfig, null, 2)}
          lang="json"
          disabled={true}
          height="51vh"
          onChange={() => {
            return;
          }}
          className="flex-1"
        />
      </div>
    </div>
  );
}
