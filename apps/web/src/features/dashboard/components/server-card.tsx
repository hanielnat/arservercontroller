import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
  InfoIcon,
  LogsIcon,
  MenuIcon,
  PlayIcon,
  PowerIcon,
  RotateCcwIcon,
  ServerIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
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
    () => server?.serverConfigData.id.slice(0, 8) ?? "",
    [server.serverConfigData.id],
  );

  const bindAddress = server?.serverConfigData.bindAddress ?? "0.0.0.0";
  const bindPort = server?.serverConfigData.bindPort ?? "N/A";

  const scenarioId = React.useMemo(() => {
    const id = (reforgerConfigGame?.scenarioId as string) ?? "";
    let result: string | undefined = "Not set";

    if (id.length > 0) {
      const missionName = id.split("/").at(-1);
      result = missionName ? missionName : result;
    }

    return result;
  }, [reforgerConfigGame]);

  const handleStart = () => {
    action.mutate({ id: server.serverConfigData.id, action: "start" });
  };

  const handleStop = () => {
    action.mutate({ id: server.serverConfigData.id, action: "stop" });
  };

  const handleRestart = () => {
    action.mutate({ id: server.serverConfigData.id, action: "restart" });
  };

  const handleRemove = (force = true) => {
    removeServer.mutate({ id: server.serverConfigData.id, force });
  };

  return (
    <Card
      className={cn("hover:ring hover:ring-card-foreground", "transition-all", className)}
      {...rest}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ServerIcon size={16} />
              <Badge
                className="text-md max-w-full overflow-hidden"
                render={
                  <span className="flex items-center gap-2">
                    <Link
                      to="/servers/$serverId"
                      params={{ serverId: server.serverConfigData.id }}
                      className="truncate"
                    >
                      {server.serverConfigData.name}
                    </Link>
                  </span>
                }
              />
            </div>

            <CardDescription className="mt-2 truncate">
              {displayName || server.serverConfigData.name}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <MenuIcon />
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <DropdownMenuItem
                  render={
                    <Link to="/servers/$serverId" params={{ serverId: server.serverConfigData.id }}>
                      <InfoIcon />
                      Details
                    </Link>
                  }
                />

                <DropdownMenuItem
                  render={
                    <Link to="/logs">
                      <LogsIcon />
                      Logs
                    </Link>
                  }
                />
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => handleRemove()}>
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="group/ip text-muted-foreground flex items-center gap-2 text-xs">
          <span className="text-foreground font-mono">
            {bindAddress}:{bindPort}
          </span>
          <CopyTextButton
            size="icon-xs"
            value={`${bindAddress}:${bindPort}`}
            className={cn(!isMobile ? "opacity-0 group-hover/ip:opacity-100" : undefined)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-start gap-2 text-sm">
          <span className="text-muted-foreground">Scenario</span>
          <code className="max-w-[60%] truncate text-right">{scenarioId ?? "Not set"}</code>
        </div>

        <div className="flex items-center justify-start gap-2 text-sm">
          <span className="text-muted-foreground">Server ID</span>
          <code className="group/id flex items-center gap-1 truncate">
            <span className="truncate">{idFormatted}</span>
            <CopyTextButton
              value={server?.serverConfigData.id}
              className="ml-1 group-hover/id:opacity-100 md:opacity-0"
            />
          </code>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center">
          <span className="flex items-center gap-2">
            <ServerHealthIndicator id={server.serverConfigData.id} />
            <ServerStatusBadge
              status={server?.serverConfigData.status ?? "dead"}
              className="align-middle"
            />
          </span>

          <ButtonGroup className={cn("transition-all", "ml-auto")}>
            <Button variant="success" onClick={handleStart}>
              <PlayIcon />
            </Button>

            <Button variant="error" onClick={handleStop}>
              <PowerIcon />
            </Button>

            <Button variant="warning" onClick={handleRestart}>
              <RotateCcwIcon />
            </Button>
          </ButtonGroup>
        </div>
      </CardFooter>
    </Card>
  );
}
