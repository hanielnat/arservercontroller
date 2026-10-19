import { cn } from "cn";
import {
  CopyIcon,
  LogsIcon,
  MenuIcon,
  PencilIcon,
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
import { useMockRemoveServer, useMockServerAction } from "@/hooks/use-server-mutation";
import type { ServerOut } from "@/types/server";

type ServerCardProps = React.ComponentProps<"div"> & {
  server: ServerOut;
};

export default function ServerCard(props: ServerCardProps) {
  const { server, className, ...rest } = props;

  const action = useMockServerAction();
  const removeServer = useMockRemoveServer();

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

  const handleOpenInfo = () => {};

  const handleOpenLogs = () => {};

  return (
    <Card
      className={cn("hover:ring hover:ring-card-foreground", "transition-all", className)}
      {...rest}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row">
            <h1>{server?.serverConfigData.name}</h1>

            <div className="ml-auto">
              <span>{server?.serverConfigData.bindAddress}</span>

              <Button className="ml-2" variant={"ghost"}>
                <CopyIcon />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <MenuIcon />
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuItem onClick={() => handleOpenInfo()}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleOpenLogs()}>
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
          {server?.serverConfigData.name} • {server?.serverConfigData.id?.split("-")[0]}...
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between gap-2">
          <div>{Math.floor(Math.random() * 100)}%</div>
          <div>{Math.floor(Math.random() * 100)}%</div>
          <div>{Math.floor(Math.random() * 128)}</div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center">
          <Badge
            className={cn(
              "items-center",
              "text-center",
              server?.serverConfigData.status === "running"
                ? "bg-green-900 text-green-200"
                : "bg-red-900 text-red-200",
            )}
          >
            {server?.serverConfigData.status} • {Math.floor(Math.random() * 24)}
          </Badge>

          <ButtonGroup className={cn("transition-all", "ml-auto")}>
            <Button onClick={async () => await handleStart()}>
              <PlayIcon />
            </Button>

            <Button onClick={async () => await handleStop()}>
              <PowerIcon />
            </Button>

            <Button onClick={async () => await handleRestart()}>
              <RotateCcwIcon />
            </Button>
          </ButtonGroup>
        </div>
      </CardFooter>
    </Card>
  );
}
