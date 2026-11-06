import { useQuery } from "@tanstack/react-query";
import type { VariantProps } from "class-variance-authority";
import { BotIcon, BroomIcon, ContainerIcon, LogsIcon, ServerIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { serversApi } from "@/api/servers";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
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

export function LogsPage() {
  const [currentServer, setCurrentServer] = useState<SelectedServer | null>(null);
  const [limit, setLimit] = useState(500);
  const [follow, setFollow] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);

  const logScrollRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);

  const [current, setCurrent] = useState<LogOrigin>("agent");
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const filteredLogs = allLogs.filter((filtered) => filtered.origin === current);

  const [streamConnections, setStreamConnections] = useState<Record<LogOrigin, boolean>>({
    agent: false,
    container: false,
  });
  const isConnected = streamConnections[current];

  const { data: servers } = useQuery({
    ...serversQueryOptions(),
    select: (data) =>
      data.data
        .filter((running) => running.serverConfigData.status === "running")
        .map((s) => ({
          label: s.serverConfigData.name ?? "Unknown",
          value: {
            id: s.serverConfigData.id,
            name: s.serverConfigData.name ?? "Unknown",
            status: s.serverConfigData.status ?? "dead",
          },
        })) satisfies ServerSelectItem[],
  });

  const serversSelect = [
    {
      label: "Server",
      value: null,
    },
    ...(servers ?? []),
  ] as ServerSelectItem[];

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

  const handleSelectServer = (server: SelectedServer | null) => {
    setAllLogs([]);
    setStreamConnections({ agent: false, container: false });
    setCurrentServer(server);
  };

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

  const eventClose = () => {
    setAllLogs([]);
    setStreamConnections({ agent: false, container: false });
    setCurrentServer(null);
  };

  const currentServerId = currentServer?.id;

  useEffect(() => {
    if (!currentServerId) {
      return;
    }

    let active = true;
    const reforgerEvents = serversApi.logStream(currentServerId, limit, follow);
    const containerEvents = serversApi.containerLogStream(currentServerId, limit, follow, false);

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
  }, [currentServerId, limit, follow, handleEventOpen, handleEventMessage, handleEventError]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col">
      <LogsHeader />

      <Card className="min-h-0 flex-1">
        <CardTitle className="flex items-center gap-2 px-4">
          {currentServer ? `Logs of ${currentServer.name}` : "Select a server"}

          <HealthIndicator
            label="Log status"
            pulseClass={currentServer ? (isConnected ? "bg-success" : "bg-warning") : "bg-muted"}
            alternateClass={
              currentServer
                ? isConnected
                  ? "bg-success-foreground"
                  : "bg-warning-foreground"
                : "bg-muted-foreground"
            }
          />
        </CardTitle>

        <CardContent
          ref={logScrollRef}
          onScroll={handleLogScroll}
          className="bg-background ring-muted mx-2 min-h-0 min-w-0 flex-1 overflow-y-auto rounded-md p-0 ring"
        >
          <div className="bg-background sticky top-0 left-0 m-0 grid grid-cols-2 items-center gap-2 border-b p-2 sm:flex sm:flex-wrap sm:p-1.5">
            <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
              <Select
                items={serversSelect}
                value={currentServer ?? null}
                onValueChange={(value) =>
                  value === currentServer ? handleSelectServer(null) : handleSelectServer(value)
                }
              >
                <SelectTrigger className="w-full min-w-0 sm:w-50">
                  <SelectValue className="min-w-0" placeholder="Select a server">
                    {(server) => (
                      <>
                        <ServerIcon />
                        <span className="truncate">{server?.name ?? "Select a server"}</span>
                      </>
                    )}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="w-50">
                  <SelectGroup>
                    <SelectLabel>Servers</SelectLabel>

                    {servers?.map((sv) => (
                      <SelectItem key={sv.value?.id} value={sv.value}>
                        <ServerIcon />
                        {sv.value?.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center gap-1">
              <Switch
                id="current-log-origin"
                onClick={() => setCurrent((prev) => (prev === "agent" ? "container" : "agent"))}
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
                  setAllLogs((prev) => trimLogsToLimit(prev, nextLimit));
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
                onClick={() => {
                  setStreamConnections({ agent: false, container: false });
                  setFollow((prev) => !prev);
                }}
                defaultChecked={follow}
              />
              <Label htmlFor="input-follow-logs" className="text-ellipsis whitespace-nowrap">
                Auto update
              </Label>
            </div>

            <div className="flex flex-row items-center gap-1">
              <Checkbox
                id="input-show-timestamps"
                onClick={() => {
                  setShowTimestamps((prev) => !prev);
                }}
                defaultChecked={showTimestamps}
              />
              <Label htmlFor="input-show-timestamps" className="text-ellipsis whitespace-nowrap">
                Show time stamps
              </Label>
            </div>

            <div className="col-span-2 ml-auto flex w-full shrink-0 flex-row justify-end overflow-x-auto sm:w-auto">
              <CopyTextButton
                variant="ghost"
                size="default"
                tooltipContent={<p>Copy logs to clipboard</p>}

                value={filteredLogs
                  .slice(Math.max(0, filteredLogs.length - limit), filteredLogs.length)
                  .map((entry) =>
                    [entry.timestamp, entry.origin.toUpperCase(), entry.msg].join(","),
                  )
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

              <Button variant="ghost" onClick={() => setAllLogs([])}>
                <BroomIcon />
                Clear
              </Button>

              <Button variant="ghost" onClick={() => eventClose()}>
                <XCircleIcon />
                Close
              </Button>
            </div>
          </div>

          <div className="mt-1 px-1 py-0">
            {filteredLogs
              .filter((filtered) => filtered.origin === current)
              .map((log, index) => {
                return (
                  <LogItem
                    key={`${log.timestamp}-${index}`}
                    entry={log}
                    showTimestamps={showTimestamps}
                  />
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
