import { useQuery } from "@tanstack/react-query";
import type { VariantProps } from "class-variance-authority";
import {
  BotIcon,
  BroomIcon,
  ContainerIcon,
  LogsIcon,
  ServerIcon,
  ServerOffIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { serversApi } from "@/api/servers";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import {
  Empty,
  EmptyContent as EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { HealthIndicator } from "@/components/ui/health-indicator";
import { Item, ItemContent } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { serversQueryOptions } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";
import type { ServerStatusEnum } from "@/types/server";

function LogsHeader() {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <LogsIcon />
        Logs
      </div>
    </div>
  );
}

type SelectedServer = {
  id: string;
  name: string;
  status: ServerStatusEnum;
};

type SelectItem<T> = {
  label: string;
  value: T | null;
};

type ServerSelectItem = SelectItem<SelectedServer>;

type LogOrigin = "agent" | "container";
type LogLevel = "" | "error";

type LogEntry = {
  timestamp?: string;
  origin: LogOrigin;
  level: LogLevel;
  msg: string;
};

function trimLogsToLimit(logs: LogEntry[], limit: number) {
  if (limit <= 0) {
    return [];
  }

  const counts: Record<LogOrigin, number> = { agent: 0, container: 0 };
  const retained: LogEntry[] = [];

  for (let index = logs.length - 1; index >= 0; index--) {
    const entry = logs[index];
    if (counts[entry.origin] >= limit) {
      continue;
    }

    counts[entry.origin]++;
    retained.push(entry);
  }

  return retained.reverse();
}

function LogItem({ entry, showTimestamps }: { entry: LogEntry; showTimestamps: boolean }) {
  const logLevelToTone = useCallback((level: LogLevel) => {
    const levelToTone: Record<
      LogLevel,
      {
        variant: NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
        border: string;
      }
    > = {
      "": {
        variant: "muted",
        border: "border-l-muted-foreground",
      },
      error: {
        variant: "error",
        border: "border-l-error-foreground",
      },
    };
    return levelToTone[level];
  }, []);

  const levelClass = logLevelToTone(entry.level);

  return (
    <Item className="my-0 min-w-0 px-1 py-0">
      <ItemContent className="w-full min-w-0">
        <div
          className={cn(
            "my-0 grid w-full min-w-0 items-start gap-x-2 py-0",
            showTimestamps
              ? "grid-cols-[5rem_14px_minmax(0,1fr)]"
              : "grid-cols-[14px_minmax(0,1fr)]",
          )}
        >
          {showTimestamps && (
            <time className="text-muted-foreground w-20 text-right font-mono whitespace-nowrap tabular-nums">
              {entry.timestamp}
            </time>
          )}

          {entry.origin === "agent" ? (
            <BotIcon className="size-3.5 shrink-0" />
          ) : (
            <ContainerIcon className="size-3.5 shrink-0" />
          )}
          <code
            className={cn(
              "w-full min-w-0 border-l-2 font-mono wrap-break-word px-4",
              levelClass.border,
            )}
          >
            {entry.msg}
          </code>
        </div>
      </ItemContent>
    </Item>
  );
}

export function ServerLogs({
  id,
  name,
  onClose,
  className,
}: {
  id: string;
  name?: string;
  onClose?: () => void;
  className?: string;
}) {
  const [limit, setLimit] = useState(300);
  const [follow, setFollow] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);
  const [current, setCurrent] = useState<LogOrigin>("agent");
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [streamConnections, setStreamConnections] = useState<Record<LogOrigin, boolean>>({
    agent: false,
    container: false,
  });
  const isConnected = streamConnections[current];

  const limitsSelect = [
    {
      label: "300",
      value: 300,
    },
    {
      label: "1000",
      value: 1000,
    },
    {
      label: "5000",
      value: 5000,
    },
    {
      label: "10000",
      value: 10000,
    },
    {
      label: "15000",
      value: 15000,
    },
  ] as SelectItem<number>[];

  const handleLogScroll = () => {
    const container = logScrollRef.current;
    if (!container) {
      return;
    }

    shouldStickToBottom.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 40;
  };

  useEffect(() => {
    const container = logScrollRef.current;
    if (container && shouldStickToBottom.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [allLogs, current]);

  const handleEventOpen = useCallback((origin: LogOrigin) => {
    console.debug("EventSource connected");
    setStreamConnections((prev) => ({ ...prev, [origin]: true }));
  }, []);

  const handleEventMessage = useCallback(
    (ev: MessageEvent, origin: LogOrigin) => {
      try {
        const msg = ev.data;
        const log: LogEntry = {
          timestamp: new Date().toLocaleTimeString(),
          origin,
          level: "",
          msg,
        };

        setAllLogs((prev) => trimLogsToLimit([...prev, log], limit));
      } catch (error) {
        console.error("Failed to parse log message", error);
      }
    },
    [limit],
  );

  const handleEventError = useCallback((error: Event, origin: LogOrigin) => {
    const msg = error instanceof ErrorEvent ? error.message : undefined;
    console.error("EventSource error", msg);
    toast.add({
      type: "error",
      title: "Unknown EventSource error",
      description: msg,
    });
    setStreamConnections((prev) => ({ ...prev, [origin]: false }));
  }, []);

  useEffect(() => {
    let active = true;
    const reforgerEvents = serversApi.logStream(id, limit, follow);
    const containerEvents = serversApi.containerLogStream(id, limit, follow, false);

    reforgerEvents.onopen = () => {
      if (active) {
        handleEventOpen("agent");
      }
    };
    reforgerEvents.onmessage = (ev: MessageEvent) => {
      if (active) {
        handleEventMessage(ev, "agent");
      }
    };
    reforgerEvents.onerror = (ev: Event) => {
      if (active) {
        handleEventError(ev, "agent");
      }
    };

    containerEvents.onopen = () => {
      if (active) {
        handleEventOpen("container");
      }
    };
    containerEvents.onmessage = (ev: MessageEvent) => {
      if (active) {
        handleEventMessage(ev, "container");
      }
    };
    containerEvents.onerror = (ev: Event) => {
      if (active) {
        handleEventError(ev, "container");
      }
    };

    return () => {
      active = false;
      reforgerEvents.close();
      containerEvents.close();
    };
  }, [id, limit, follow, handleEventOpen, handleEventMessage, handleEventError]);

  const filteredLogs = allLogs.filter((entry) => entry.origin === current);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      <div className="bg-background sticky top-0 left-0 m-0 flex flex-wrap items-center gap-2 rounded-t-md border-b p-2 sm:p-1.5">
        <div className="mr-auto flex shrink-0 items-center gap-2">
          <span className="truncate">{name ? `Logs of ${name}` : "Server logs"}</span>

          <HealthIndicator
            label={`${current} log status`}
            pulseClass={isConnected ? "bg-success" : "bg-warning"}
            alternateClass={isConnected ? "bg-success-foreground" : "bg-warning-foreground"}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex flex-row items-center gap-1">
            <Switch
              id="current-log-origin"
              checked={current === "container"}
              onCheckedChange={(checked) => setCurrent(checked ? "container" : "agent")}
            />
            <Label
              htmlFor="current-log-origin"
              className="text-ellipsis whitespace-nowrap capitalize"
            >{`${current} logs`}</Label>
          </div>

          <div className="col-span-2 flex min-w-0 flex-row items-center gap-1 sm:col-span-1">
            <Select
              id="input-line-limit"
              items={limitsSelect}
              value={limit}
              onValueChange={(value) => {
                const nextLimit = value ?? 10;
                setStreamConnections({ agent: false, container: false });
                setLimit(nextLimit);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue>{limit ?? 10}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {limitsSelect.map((lim, index) => (
                  <SelectItem key={index} value={lim.value}>
                    {lim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="input-line-limit" className="text-ellipsis whitespace-nowrap">
              Lines to fetch
            </Label>
          </div>

          <div className="flex flex-row items-center gap-1">
            <Checkbox
              id="input-follow-logs"
              checked={follow}
              onCheckedChange={(checked) => {
                setStreamConnections({ agent: false, container: false });
                setFollow(checked);
              }}
            />
            <Label htmlFor="input-follow-logs" className="text-ellipsis whitespace-nowrap">
              Auto update
            </Label>
          </div>

          <div className="flex flex-row items-center gap-1">
            <Checkbox
              id="input-show-timestamps"
              checked={showTimestamps}
              onCheckedChange={setShowTimestamps}
            />
            <Label htmlFor="input-show-timestamps" className="text-ellipsis whitespace-nowrap">
              Show time stamps
            </Label>
          </div>

          <div className="ml-auto flex shrink-0 flex-row justify-end overflow-x-auto">
            <CopyTextButton
              variant="ghost"
              size="default"
              tooltipContent={<p>Copy logs to clipboard</p>}

              value={filteredLogs
                .slice(Math.max(0, filteredLogs.length - limit), filteredLogs.length)
                .map((entry) => [entry.timestamp, entry.origin.toUpperCase(), entry.msg].join(","))
                .join("\n")}

              onCopy={() => {
                const lineCount = [
                  ...filteredLogs.slice(
                    Math.max(0, filteredLogs.length - limit),
                    filteredLogs.length,
                  ),
                ].length;
                toast.add({
                  type: "success",
                  title: <span>Copied {lineCount} lines to clipboard</span>,
                });
              }}
            >
              Copy
            </CopyTextButton>

            <Button type="button" variant="ghost" onClick={() => setAllLogs([])}>
              <BroomIcon />
              Clear
            </Button>

            {onClose && (
              <Button type="button" variant="ghost" onClick={onClose}>
                <XCircleIcon />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      <div
        ref={logScrollRef}
        onScroll={handleLogScroll}
        className="bg-background ring-muted min-h-0 min-w-0 flex-1 overflow-y-auto rounded-md rounded-t-none p-0 ring"
      >
        <div className="mt-1 px-1 py-0">
          {filteredLogs.map((log, index) => (
            <LogItem
              key={`${log.timestamp}-${index}`}
              entry={log}
              showTimestamps={showTimestamps}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LogsPage() {
  const [currentServer, setCurrentServer] = useState<SelectedServer | null>(null);

  const { data: servers } = useQuery({
    ...serversQueryOptions(),
    select: (data) =>
      data.data.map((server) => ({
        label: server.serverConfigData.name ?? "Unknown",
        value: {
          id: server.serverConfigData.id,
          name: server.serverConfigData.name ?? "Unknown",
          status: server.serverConfigData.status ?? "dead",
        },
      })) satisfies ServerSelectItem[],
  });

  const serversSelect = [
    { label: "Server", value: null },
    ...(servers ?? []),
  ] as ServerSelectItem[];

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col">
      <LogsHeader />
      <Card className="min-h-0 flex-1">
        <CardTitle className="flex flex-wrap items-center gap-2 px-4">
          <span className="mr-auto">
            {currentServer ? `Logs of ${currentServer.name}` : "Select a server"}
          </span>
          <Select items={serversSelect} value={currentServer} onValueChange={setCurrentServer}>
            <SelectTrigger className="w-full min-w-0 sm:w-50">
              <SelectValue className="min-w-0" placeholder="Select a server">
                {(server) => (
                  <span className="flex min-w-0 items-center gap-2">
                    <ServerIcon />
                    <span className="truncate">{server?.name ?? "Select a server"}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-50">
              <SelectGroup>
                <SelectLabel>Servers</SelectLabel>
                {servers?.map((server) => (
                  <SelectItem
                    key={server.value?.id}
                    value={server.value}
                    disabled={server.value.status !== "running"}
                  >
                    <ServerIcon />
                    {server.value?.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardTitle>
        <CardContent className="flex min-h-0 flex-1 flex-col p-2">
          {currentServer ? (
            <ServerLogs
              key={currentServer.id}
              id={currentServer.id}
              name={currentServer.name}
              onClose={() => setCurrentServer(null)}
            />
          ) : (
            <Empty className="bg-background border-secondary border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ServerOffIcon />
                </EmptyMedia>

                <EmptyTitle>No server selected.</EmptyTitle>

                <EmptyDescription>Select a server to view its logs.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
