import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { EllipsisVerticalIcon, InfoIcon, LogsIcon, ServerIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ServerActionDelete, ServerActions } from "@/features/dashboard/components/server-actions";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import type { ServerOut } from "@/types/server";

type ServerCardProps = React.ComponentProps<"div"> & {
  server: ServerOut;
};

export default function ServerCard(props: ServerCardProps) {
  const { server, className, ...rest } = props;

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

  return (
    <Card
      className={cn(
        "ring-muted ring-2 hover:ring-1 hover:ring-muted-foreground/50",
        "transition-all",
        className,
      )}
      {...rest}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-0.5">
              <Badge
                variant="secondary"
                className="bg-primary text-primary-foreground dark:text-primary-foreground size-fit shrink-0 overflow-hidden rounded-sm p-1"
                render={<ServerIcon size={16} />}
              />

              <Button
                variant="link"
                className="dark:text-primary-foreground flex flex-row items-center gap-2 text-[15px]"
              >
                <Link
                  to="/servers/$serverId"
                  params={{ serverId: server.serverConfigData.id }}
                  className="truncate"
                >
                  {server.serverConfigData.name}
                </Link>
              </Button>
            </div>

            <CardDescription className="mt-2 truncate text-[13px]">
              {displayName || server.serverConfigData.name}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <EllipsisVerticalIcon />
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

                <DropdownMenuItem
                  render={
                    <CopyTextButton
                      size="default"
                      showTooltip={false}
                      value={server.serverConfigData.id}
                      className="w-full justify-start"
                    >
                      Copy ID
                    </CopyTextButton>
                  }
                />

                <DropdownMenuItem
                  render={
                    <CopyTextButton
                      size="default"
                      showTooltip={false}
                      value={`${bindAddress}:${bindPort}`}
                      className="w-full justify-start"
                    >
                      Copy Address
                    </CopyTextButton>
                  }
                />
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  closeOnClick={false}
                  render={
                    <ServerActionDelete
                      size="default"
                      id={server.serverConfigData.id}
                      className="w-full"
                    >
                      Delete
                    </ServerActionDelete>
                  }
                />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-foreground font-mono">
          {bindAddress}:{bindPort}
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        <div className="flex items-center justify-start gap-2 text-xs">
          <span className="text-muted-foreground">Scenario</span>
          <code className="max-w-[60%] truncate text-right">{scenarioId ?? "Not set"}</code>
        </div>

        <div className="flex items-center justify-start gap-2 text-xs">
          <span className="text-muted-foreground">Server ID</span>
          <code className="truncate">{idFormatted}</code>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full flex-row items-center gap-0.5">
          <span className="flex items-center gap-2">
            <ServerHealthIndicator id={server.serverConfigData.id} />
            <ServerStatusBadge
              status={server?.serverConfigData.status ?? "dead"}
              className="align-middle"
            />
          </span>

          <ServerActions id={server?.serverConfigData.id ?? ""} className="ml-auto" />
        </div>
      </CardFooter>
    </Card>
  );
}
