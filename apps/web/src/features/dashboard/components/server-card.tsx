import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
  InfoIcon,
  LogsIcon,
  MenuIcon,
  PlayIcon,
  PowerIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRemoveServer, useServerAction } from "@/hooks/use-server-mutation";
import type { ServerOut } from "@/types/server";

type ServerCardProps = React.ComponentProps<"div"> & {
  server: ServerOut;
};

export default function ServerCard(props: ServerCardProps) {
  const { server, className, ...rest } = props;

  const action = useServerAction();
  const removeServer = useRemoveServer();

  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const reforgerConfigGame = React.useMemo(
    () => (server?.serverConfigData.reforgerConfig.game as Record<string, unknown>) ?? undefined,
    [server.serverConfigData.reforgerConfig],
  );

  const displayName = React.useMemo(
    () => (reforgerConfigGame?.name as string) ?? server?.serverConfigData.name,
    [reforgerConfigGame, server.serverConfigData.name],
  );

  const idFormatted = React.useMemo(
    () => server?.serverConfigData.id?.split("-")[0].concat("..."),
    [server.serverConfigData.id],
  );

  const scenarioId = React.useMemo(() => {
    const result = (reforgerConfigGame?.scenarioId as string) ?? undefined;
    return result;
  }, [reforgerConfigGame]);

  const handleStart = async () => {
    action.mutate(
      { id: server.serverConfigData.id, action: "start" },
      {
        onSuccess: (data) => {
          toast.add({ data, title: "Server started" });
        },
        onError: (error) => {
          toast.add({ data: error, title: "Server failed to start", description: error.message });
        },
      },
    );
  };

  const handleStop = async () => {
    action.mutate(
      { id: server.serverConfigData.id, action: "stop" },
      {
        onSuccess: (data) => {
          toast.add({ data, title: "Server stopped" });
        },
        onError: (error) => {
          toast.add({ data: error, title: "Server failed to stop", description: error.message });
        },
      },
    );
  };

  const handleRestart = async () => {
    action.mutate(
      { id: server.serverConfigData.id, action: "restart" },
      {
        onSuccess: (data) => {
          toast.add({ data, title: "Server restarted" });
        },
        onError: (error) => {
          toast.add({ data: error, title: "Server failed to restart", description: error.message });
        },
      },
    );
  };

  const handleRemove = async (force = true) => {
    let toastId: string;
    if (removeServer.isPending) {
      toastId = toast.add({ title: "Removing server" });
    }

    removeServer.mutate(
      { id: server.serverConfigData.id, force },
      {
        onSuccess: (data) => {
          toast.add({ data, title: "Server removed" });
        },
        onError: (error) => {
          toast.update(toastId, {
            data: error,
            title: "Server failed to be removed",
            description: error.message,
          });
        },
      },
    );
  };

  return (
    <Card
      className={cn("hover:ring hover:ring-card-foreground", "transition-all", className)}
      {...rest}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row items-center">
            <Badge
              className="text-md"
              render={
                <span className="flex items-center gap-2">
                  <ServerHealthIndicator id={server.serverConfigData.id} />
                  <Link to="/servers/$serverId" params={{ serverId: server.serverConfigData.id }}>
                    {server.serverConfigData.name}
                  </Link>
                </span>
              }
            />

            <div className="ml-auto flex items-center gap-1">
              <div className="group/ip flex items-center gap-1">
                <CopyTextButton
                  size="icon-sm"
                  value={server?.serverConfigData.bindAddress as string}
                  className={cn(!isMobile ? "opacity-0 group-hover/ip:opacity-100" : undefined)}
                />

                <span className="font-mono text-xs">{server?.serverConfigData.bindAddress}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                  <MenuIcon />
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() =>
                        navigate({
                          to: "/servers/$serverId",
                          params: { serverId: server.serverConfigData.id ?? "" },
                        })
                      }
                    >
                      <InfoIcon />
                      Details
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => toast.add({ title: "Opening logs..." })}>
                      <LogsIcon />
                      Logs
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={async () => await handleRemove()}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardTitle>

        <CardDescription>
          {displayName} •{" "}
          <code className="group/id">
            {idFormatted}
            <CopyTextButton
              value={server?.serverConfigData.id}
              className="ml-1 group-hover/id:opacity-100 md:opacity-0"
            />
          </code>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between gap-2">
          {scenarioId && (
            <span className="flex flex-row justify-between gap-2">
              <span>Scenario</span>
              <code>{scenarioId}</code>
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center">
          <ServerStatusBadge
            status={server?.serverConfigData.status ?? "dead"}
            className="align-middle"
          />

          <ButtonGroup className={cn("transition-all", "ml-auto")}>
            <Button variant="success" onClick={async () => await handleStart()}>
              <PlayIcon />
            </Button>

            <Button variant="error" onClick={async () => await handleStop()}>
              <PowerIcon />
            </Button>

            <Button variant="warning" onClick={async () => await handleRestart()}>
              <RotateCcwIcon />
            </Button>
          </ButtonGroup>
        </div>
      </CardFooter>
    </Card>
  );
}
