import {
  CableIcon,
  ContainerIcon,
  NetworkIcon,
  RadioIcon,
  TerminalIcon,
  VariableIcon,
  WifiIcon,
  type LucideIcon,
} from "lucide-react";
import type React from "react";
import { useMemo } from "react";

import { CodeTextArea } from "@/components/ui/code-textarea";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import { cn } from "@/lib/utils";
import type { ServerConfig, ServerStatusEnum } from "@/types/server";

interface ServerProperty {
  label: React.ReactNode;
  key: keyof ServerConfig;
  value: ServerConfig[keyof ServerConfig] | undefined;
  valueRender?: (value: ServerConfig[keyof ServerConfig] | undefined) => React.ReactNode;
}

function valueAsRenderable(value: ServerConfig[keyof ServerConfig] | undefined) {
  if (value === undefined || value === null) {
    return "Not set";
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

function labelIconRender(label: string, Icon: LucideIcon) {
  return (
    <span className="flex items-center gap-1">
      <Icon size={16} className="text-muted-foreground" />
      {label}
    </span>
  );
}

function copyableValueRender(value: ServerConfig[keyof ServerConfig] | undefined) {
  const renderedValue = valueAsRenderable(value);

  return (
    <span className="flex items-center gap-1">
      <CopyTextButton size="icon-xs" value={renderedValue} />
      <code>{renderedValue}</code>
    </span>
  );
}

function ServerPropertyListItem({ label, value, valueRender }: Omit<ServerProperty, "key">) {
  return (
    <li className="flex w-full flex-row items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      {label}
      <span className="font-mono">
        {valueRender ? valueRender(value) : valueAsRenderable(value)}
      </span>
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
        label: labelIconRender("Status", WifiIcon),
        key: "status",
        value: config?.status,
        valueRender: (value) =>
          value ? <ServerStatusBadge status={value as ServerStatusEnum} /> : "Not set",
      },
      {
        label: labelIconRender("IP Address", NetworkIcon),
        key: "bindAddress",
        value: config?.bindAddress,
        valueRender: copyableValueRender,
      },
      {
        label: labelIconRender("Bind Port", RadioIcon),
        key: "bindPort",
        value: config?.bindPort,
      },
      {
        label: labelIconRender("A2S Port", RadioIcon),
        key: "a2sPort",
        value: config?.a2sPort,
      },
      {
        label: labelIconRender("RCON Port", RadioIcon),
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
    <div className={cn("flex flex-1 flex-col gap-2 p-0 sm:flex-row", className)}>
      <ul className="bg-background/30 max-w-lg rounded-md border">
        {properties.map(({ key, ...property }) => (
          <ServerPropertyListItem key={key} {...property} />
        ))}
      </ul>

      <div className="flex-1">
        <CodeTextArea
          lang="json"
          value={JSON.stringify(config?.reforgerConfig ?? {})}
          onChange={(value) => console.log(value)}
          minHeight="100%"
          className="h-full"
        />
      </div>
    </div>
  );
}
