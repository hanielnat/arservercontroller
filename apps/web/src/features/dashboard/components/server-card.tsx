import { cn } from "cn";
import {
  CopyIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import type { ServerOut } from "@/types/server";

type ServerCardProps = React.ComponentProps<"div"> & {
  server: ServerOut;
};

export default function ServerCard(props: ServerCardProps) {
  const { server, className, ...rest } = props;

  const handleStart = async () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => resolve("server"), 2000);
      }),
      {
        loading: "Starting server...",
        success: () => "Server started",
        error: () => "Error starting server",
      },
    );
  };

  const handleStop = async () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => resolve("server"), 2000);
      }),
      {
        loading: "Stopping server...",
        success: () => "Server stopped",
        error: () => "Error stopping server",
      },
    );
  };

  const handleRestart = async () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => resolve("server"), 2000);
      }),
      {
        loading: "Restarting server...",
        success: () => "Server restarted",
        error: () => "Error restarting server",
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
          <div className="flex flex-row">
            <h1>{server.serverConfigData.name}</h1>

            <div className="ml-auto">
              <span>{server.serverConfigData.bindAddress}</span>

              <Button className="ml-2" variant={"ghost"}>
                <CopyIcon />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <MenuIcon />
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <MenuIcon />
                      Details
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <LogsIcon />
                      Logs
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive">
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
          {server.serverConfigData.name} • {server.serverConfigData.id?.split("-")[0]}...
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between gap-2">
          <div>{Math.random()}%</div>
          <div>{Math.random()}%</div>
          <div>{Math.random()}</div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center">
          <Badge
            className={cn(
              "items-center",
              "text-center",
              server.serverConfigData.status === "running"
                ? "bg-green-900 text-green-200"
                : "bg-red-900 text-red-200",
            )}
          >
            {server.serverConfigData.status} • {Math.random()}
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
