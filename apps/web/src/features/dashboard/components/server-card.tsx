import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
  ContainerIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  InfoIcon,
  LogsIcon,
  MapIcon,
  ServerIcon,
} from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ServerActionDelete, ServerActions } from "@/features/dashboard/components/server-actions";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import type { ServerOut } from "@/types/server";

type ServerCardProps = React.ComponentProps<"div"> & {
  server: ServerOut;
  refetchStatusEnabled?: boolean
};

export default function ServerCard(props: ServerCardProps) {
  const { server, refetchStatusEnabled = true, className, ...rest } = props;

  const reforgerConfigGame = React.useMemo(
    () => (server?.serverConfigData.reforgerConfig.game as Record<string, unknown>) ?? undefined,
    [server.serverConfigData.reforgerConfig],
  );

  const displayName = React.useMemo(
    () => (reforgerConfigGame?.name as string) ?? server?.serverConfigData.name,
    [reforgerConfigGame, server.serverConfigData.name],
  );

  const idFormatted = React.useMemo(
    () => server?.serverConfigData.id.slice(0, 8) ?? "unknown",
    [server.serverConfigData.id],
  );

  const bindAddress = server?.serverConfigData.bindAddress ?? "unknown";
  const bindPort = server?.serverConfigData.bindPort ?? "unknown";

  const scenarioId = React.useMemo(() => {
    const id = (reforgerConfigGame?.scenarioId as string) ?? "";
    let result: string | undefined = "unknown";

    if (id.length > 0) {
      const missionName = id.split("/").at(-1);
      result = missionName ? missionName : result;
    }

    return { trimmed: result, full: id };
  }, [reforgerConfigGame]);

  const dropDownMenuItems = React.useMemo(
    () => [
      {
        render: (
          <Link to="/servers/$serverId" params={{ serverId: server.serverConfigData.id }}>
            <InfoIcon />
            Details
          </Link>
        ),
      },
      {
        render: (
          <Link to="/logs">
            <LogsIcon />
            Logs
          </Link>
        ),
      },
      {
        render: (
          <CopyTextButton
            size="default"
            showTooltip={false}
            value={server.serverConfigData.id}
            className="w-full justify-start"
          >
            Copy ID
          </CopyTextButton>
        ),
      },
      {
        render: (
          <CopyTextButton
            size="default"
            showTooltip={false}
            value={`${bindAddress}:${bindPort}`}
            className="w-full justify-start"
          >
            Copy Address
          </CopyTextButton>
        ),
      },
      {
        render: (
          <CopyTextButton
            size="default"
            showTooltip={false}
            value={!scenarioId.full ? "unknown" : scenarioId.full}
            className="w-full justify-start"
          >
            Copy scenario ID
          </CopyTextButton>
        ),
      },
    ],
    [server.serverConfigData.id, bindAddress, bindPort, scenarioId.full],
  );

  const serverProps = React.useMemo(() => {
    return [
      {
        label: (
          <React.Fragment>
            <HeartIcon className="rounded-md bg-secondary p-1" />
            Health
          </React.Fragment>
        ),
        render: (
          <ServerHealthIndicator
            id={server.serverConfigData.id}
            showTooltip={true}
            renderBadge={true}
          />
        ),
      },
      {
        label: (
          <React.Fragment>
            <ContainerIcon className="rounded-md bg-secondary p-1" />
            Status
          </React.Fragment>
        ),
        render: (
          <ServerStatusBadge
            id={server.serverConfigData.id ?? ""}
            enabled={refetchStatusEnabled}
            className="align-middle"
          />
        ),
      },
      {
        label: (
          <React.Fragment>
            <MapIcon className="rounded-md bg-secondary p-1" />
            Scenario
          </React.Fragment>
        ),
        render: (
          <Tooltip>
            <TooltipTrigger
              render={<code className="max-w-fit font-mono">{scenarioId.trimmed}</code>}
            />

            {scenarioId.full ? (
              <TooltipContent className="max-w-fit font-mono">{scenarioId.full}</TooltipContent>
            ) : null}
          </Tooltip>
        ),
      },
      {
        label: (
          <React.Fragment>
            <ServerIcon className="rounded-md bg-secondary p-1" />
            Server
          </React.Fragment>
        ),
        render: <code className="truncate">{idFormatted}</code>,
      },
    ] as Array<{ label: React.ReactNode; render: React.ReactNode }>;
  }, [scenarioId, idFormatted, server.serverConfigData.id, server.serverConfigData.status]);

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
                className="size-fit shrink-0 overflow-hidden rounded-sm bg-primary p-1 text-primary-foreground dark:text-primary-foreground"
                render={<ServerIcon size={16} />}
              />

              <Button
                variant="link"
                className="flex flex-row items-center gap-2 text-[15px] dark:text-primary-foreground"
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

            <DropdownMenuContent className="w-fit">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {dropDownMenuItems.map((item, index) => (
                  <DropdownMenuItem key={index} render={item.render} />
                ))}
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

        <div className="font-mono text-foreground">
          {bindAddress}:{bindPort}
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {serverProps.map((prop, index) => (
          <div
            key={index}
            className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-2 text-xs"
          >
            <span className="flex shrink-0 flex-row items-center gap-1 overflow-hidden text-muted-foreground">
              {prop.label}
            </span>
            {prop.render}
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <ServerActions id={server.serverConfigData.id} className="ml-auto" />
      </CardFooter>
    </Card>
  );
}
