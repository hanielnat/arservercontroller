import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  CircleXIcon,
  EllipsisIcon,
  LayersPlusIcon,
  PlayIcon,
  PlayOff,
  PlusIcon,
  TerminalIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { serversApi } from "@/api/servers";
import { serverKeys } from "@/api/servers.keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemContent, ItemGroup, ItemMedia } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { WebSocketLike } from "@/types/dashboard";

type PhaseType = "" | "manager" | "docker";
type StepType =
  | ""
  | "error"
  // creation manager
  | "success"
  | "start"
  | "fail"
  | "cancel"
  | "agent_start"
  | "agent_started"
  | "agent_error"
  // docker
  | "prepare"
  | "create"
  | "created";

interface LogType {
  time?: string;
  phase?: PhaseType;
  step?: StepType;
  error?: boolean;
  final?: boolean;
  message: string;
}

function stepToIcon(step: StepType) {
  const errorIcon = <CircleXIcon />;
  const startIcon = <PlayIcon />;
  const cancelIcon = <PlayOff />;
  const successIcon = <CheckCircle2Icon />;
  const completedIcon = <CheckIcon />;
  const createIcon = <PlusIcon />;
  const prepareIcon = <LayersPlusIcon />;

  switch (step) {
    case "":
      return <EllipsisIcon />;
    case "agent_error":
      return errorIcon;
    case "agent_start":
      return startIcon;
    case "agent_started":
      return completedIcon;
    case "cancel":
      return cancelIcon;
    case "create":
      return createIcon;
    case "created":
      return completedIcon;
    case "error":
      return errorIcon;
    case "fail":
      return errorIcon;
    case "prepare":
      return prepareIcon;
    case "start":
      return startIcon;
    case "success":
      return successIcon;
  }
}

function formatElapsedTime(elapsedMs: number) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const minutes = Math.floor(totalSeconds / 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${seconds}`;
  }

  return `${String(minutes).padStart(2, "0")}:${seconds}`;
}

function ServerCreationProgressHeader({
  elapsedMs,
  isCreating,
  isDone,
  isCancelling,
  onCancel,
}: {
  elapsedMs: number;
  isCreating: boolean;
  isDone: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 mb-6 flex flex-row flex-wrap items-center gap-4">
      <TerminalIcon />
      <div className="flex flex-col items-start">
        <span className="text-xl">Server Creation Logs</span>
      </div>
      <Badge variant="ghost" className="ml-auto font-mono tabular-nums">
        Elapsed {formatElapsedTime(elapsedMs)}
      </Badge>
      {(isCreating || isDone) && (
        <Button variant="destructive" onClick={onCancel} disabled={isCancelling || isDone}>
          <PlayOff />
          {isCancelling ? "Cancelling..." : "Cancel creation"}
        </Button>
      )}
    </div>
  );
}

function ProgressSection({
  label,
  isDone,
  hasError,
  children,
}: { label: string; isDone: boolean; hasError: boolean } & React.ComponentProps<"div">) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "mb-2 flex flex-row items-center gap-2 rounded-md p-2",
          hasError
            ? "bg-error/50 text-error-foreground dark:bg-error dark:text-error-foreground"
            : isDone
              ? "bg-success/50 text-success-foreground dark:bg-success dark:text-success-foreground"
              : "bg-secondary dark:bg-card",
        )}
      >
        <span className="px-2">
          {!isDone ? (
            <Spinner />
          ) : hasError ? (
            <CircleXIcon className="size-4" />
          ) : (
            <CheckCircle2Icon className="size-4" />
          )}
        </span>

        <span className="text-md">{label}</span>

        <CollapsibleTrigger
          className="ml-auto"
          render={
            <Button variant={hasError ? "error" : isDone ? "success" : "ghost"} size="icon">
              <ChevronsUpDownIcon />
            </Button>
          }
        />
      </div>
      <CollapsibleContent className="flex flex-col gap-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function LogMessage({ log, className }: { log: LogType } & React.ComponentProps<"div">) {
  return (
    <Item
      variant="outline"
      className={cn(
        log.error ||
          log?.step === "error" ||
          log?.step === "fail" ||
          log?.step === "agent_error" ||
          log?.step === "cancel"
          ? "bg-error"
          : undefined,
        className,
      )}
    >
      <ItemContent className="flex flex-row gap-4">
        <ItemMedia variant="icon">{stepToIcon(log?.step ?? "")}</ItemMedia>
        <span>{log.message}</span>
        <Badge variant="ghost" className="ml-auto">
          {log.time}
        </Badge>
      </ItemContent>
    </Item>
  );
}

interface ServerCreationProgressProps {
  id: string;
  isCreating: boolean;
  onSetIsCreating: (value: boolean) => void;
  isDone: boolean;
  onSetIsDone: (value: boolean) => void;
  onSetIsSuccessful: (value: boolean) => void;
}

export function ServerCreationProgress({
  id,
  isCreating,
  isDone,
  onSetIsCreating,
  onSetIsDone,
  onSetIsSuccessful,
}: ServerCreationProgressProps) {
  const wsRef: React.Ref<WebSocketLike | null> = useRef(null);
  const startedAtRef = useRef<number | null>(null);
  const [managerLogs, setManagerLogs] = useState<LogType[]>([]);
  const [dockerLogs, setDockerLogs] = useState<LogType[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [erroredPhase, setErroredPhase] = useState<PhaseType>("");

  const qc = useQueryClient();
  const cancelCreation = useMutation({
    mutationKey: serverKeys.lists(),
    mutationFn: ({ id }: { id: string }) => serversApi.cancelAdd(id),
    onSettled: () => {
      onSetIsCreating(false);
      onSetIsSuccessful(false);
      onSetIsDone(true);
      qc.invalidateQueries({ queryKey: serverKeys.lists() });
      wsRef.current?.close(1000, "server creation cancelled");
    },
  });

  const handleOpen = useCallback(() => {
    console.debug("Websocket connected");
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    onSetIsCreating(true);
    onSetIsDone(false);
  }, [onSetIsCreating, onSetIsDone]);

  const handleMessage = useCallback(
    (ev: MessageEvent) => {
      console.debug(`handleMessage(ev: ${ev})`);

      try {
        const msg: LogType = JSON.parse(ev.data);

        const log: LogType = {
          time: new Date().toLocaleTimeString(),
          phase: msg.phase,
          step: msg.step,
          error: msg.error,
          final: msg.final,
          message: msg.message,
        };

        if (msg.phase === "manager") {
          setManagerLogs((prev) => [...prev, log]);
        } else {
          setDockerLogs((prev) => [...prev, log]);
        }

        if (
          msg.error ||
          msg.step === "error" ||
          msg.step === "fail" ||
          msg.step === "agent_error"
        ) {
          setHasError(true);
          setErroredPhase(msg.phase ?? "");
        }

        if (msg.final) {
          if (startedAtRef.current !== null) {
            setElapsedMs(Date.now() - startedAtRef.current);
            startedAtRef.current = null;
          }

          onSetIsCreating(false);

          if (hasError) {
            onSetIsSuccessful(false);
            onSetIsDone(true);
            return;
          }

          onSetIsSuccessful(true);
          onSetIsDone(true);
        }
      } catch (error) {
        console.error("Failed to parse log message", error);
      }
    },
    [hasError, onSetIsCreating, onSetIsDone, onSetIsSuccessful],
  );

  const handleError = useCallback(
    (error: Event) => {
      const msg = error instanceof ErrorEvent ? error.message : undefined;
      console.error("Websocket error", msg);
      toast.add({
        type: "error",
        title: "Unknown WebSocket error",
        description: msg,
      });

      setHasError(true);
      setErroredPhase("");
      onSetIsCreating(false);
      onSetIsSuccessful(false);
      onSetIsDone(true);
    },
    [onSetIsCreating, onSetIsDone, onSetIsSuccessful],
  );

  const handleClose = useCallback(() => {
    console.debug("Websocket disconnected");
    onSetIsCreating(false);
    onSetIsDone(true);
  }, [onSetIsCreating, onSetIsDone]);

  const handleCancel = useCallback(
    () =>
      cancelCreation.mutate(
        { id },
        {
          onSuccess: (data, variables) => {
            if (data.cancelled !== true) {
              return { cancelled: false };
            }

            console.debug(
              `Server creation cancel request sucessful for '${variables.id}', reponse: ${JSON.stringify(data)}`,
            );
          },

          onError: (error) => {
            toast.add({
              type: "error",
              title: "Error cancelling server creation",
              description: error.message,
            });

            cancelCreation.reset();
          },
        },
      ),
    [id, cancelCreation],
  );

  const socketConnect = useCallback(() => {
    const ws = serversApi.creationLogsWs(id);
    wsRef.current = ws;

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onmessage = handleMessage;
    ws.onerror = handleError;
  }, [id, handleOpen, handleClose, handleMessage, handleError]);

  useEffect(() => {
    socketConnect();
    return () => {
      wsRef.current?.close(1000, "Component unmounted");
      setManagerLogs([]);
      setDockerLogs([]);
    };
  }, [socketConnect]);

  useEffect(() => {
    const startedAt = startedAtRef.current;
    if (!isCreating || startedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isCreating]);

  return (
    <>
      <ServerCreationProgressHeader
        elapsedMs={elapsedMs}
        isCreating={isCreating}
        isDone={isDone}
        isCancelling={cancelCreation.isPending}
        onCancel={handleCancel}
      />

      <Card
        className={cn(
          "bg-background mx-auto flex size-full flex-col overflow-y-auto no-scrollbar p-1.5 transition-all",
          hasError
            ? "ring-2 ring-error"
            : isDone
              ? "ring-2 ring-success/50 dark:ring-success"
              : undefined,
        )}
      >
        <CardContent className="p-1.5">
          <div className="flex flex-col gap-2">
            {managerLogs.length > 0 && (
              <ProgressSection
                label="Manager"
                isDone={isDone}
                hasError={hasError && erroredPhase === "manager"}
              >
                {managerLogs.map((log, index) => (
                  <ItemGroup key={`manager${index}`}>
                    <LogMessage key={index} log={log} />
                  </ItemGroup>
                ))}
              </ProgressSection>
            )}

            {dockerLogs.length > 0 && (
              <ProgressSection
                label="Docker"
                isDone={isDone}
                hasError={hasError && erroredPhase === "docker"}
              >
                {dockerLogs.map((log, index) => (
                  <ItemGroup key={`docker${index}`}>
                    <LogMessage key={index} log={log} />
                  </ItemGroup>
                ))}
              </ProgressSection>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
