import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, InfoIcon, PenIcon, ServerIcon, XIcon } from "lucide-react";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerActionDelete, ServerActions } from "@/features/dashboard/components/server-actions";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerProperties } from "@/features/dashboard/components/server-properties";
import { UpdateServerForm } from "@/features/dashboard/components/update-server-form";
import { ServerLogs } from "@/features/dashboard/logs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUpdateServer } from "@/hooks/use-server-mutation";
import { serversQueryOptions } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";
import { ServerConfigSchema } from "@/types/server.schema";

function ServerInfoHeader({ id }: { id: string }) {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="flex flex-row items-center gap-2">
          <InfoIcon />
          <span className="text-bold text-2xl">Server Details</span>
        </span>

        {!isMobile && <span className="self-center">•</span>}

        <div className="group/id flex flex-row items-center gap-0">
          <Badge variant="outline" className="p-2">
            <span className="font-mono text-[10pt]">{id}</span>
          </Badge>
          <CopyTextButton
            size="xs"
            variant="ghost"
            value={id}
            className={cn("p-2", !isMobile ? "opacity-0 group-hover/id:opacity-100" : undefined)}
          />
        </div>
      </div>
    </div>
  );
}

export function ServerInfo({
  id,
  className,
  ...props
}: { id: string } & React.ComponentProps<"div">) {
  const [isChangingName, setIsChangingName] = useState(false);
  const [changedName, setChangedName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { data: server } = useQuery({
    ...serversQueryOptions(),
    select: (data) => data.data.find((s) => id === s.serverConfigData.id),
  });

  const update = useUpdateServer();

  const handleUpdateName = (newName: string) => {
    if (!server) {
      return;
    }

    if (!server.serverConfigData.reforgerConfig) {
      return;
    }

    if (!isChangingName) {
      return;
    }

    update.mutate({
      id,
      data: {
        ...server.serverConfigData,
        name: newName,
      },
    });
  };

  return (
    <div className={cn(className)} {...props}>
      <ServerInfoHeader id={id} />

      <Card className="mt-4 w-full rounded-md p-4 align-middle md:mx-auto md:min-h-min md:flex-1">
        <CardTitle className="text-bold flex items-center gap-2 text-xl">
          <ServerIcon />

          {isChangingName ? (
            <React.Fragment>
              <Field className="max-w-64">
                <Input
                  type="text"
                  value={changedName ?? ""}
                  onChange={(ev) => {
                    setChangedName(ev.target.value);
                    setNameError(null);
                  }}
                  className="w-fit"
                />
                <FieldError>{nameError}</FieldError>
              </Field>

              <Button
                size="icon"
                variant="success"
                disabled={!changedName?.trim() || update.isPending}
                onClick={() => {
                  const result = ServerConfigSchema.shape.name.safeParse(changedName ?? "");
                  if (!result.success) {
                    setNameError(result.error.issues[0].message ?? "Invalid name  ");
                    return;
                  }

                  setNameError(null);
                  handleUpdateName(result.data);
                  setIsChangingName(false);
                }}
              >
                <CheckIcon />
              </Button>

              <Button
                size="icon"
                variant="muted"
                onClick={() => {
                  setChangedName(null);
                  setIsChangingName(false);
                  setNameError(null);
                }}
              >
                <XIcon />
              </Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <span>{server?.serverConfigData.name}</span>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setChangedName(server?.serverConfigData.name ?? "");
                  setIsChangingName(true);
                }}
              >
                <PenIcon />
              </Button>
            </React.Fragment>
          )}

          <ServerHealthIndicator
            renderBadge={true}
            id={server?.serverConfigData.id ?? ""}
            className="ml-2"
          />

          <span className="items-cente ml-auto flex flex-row gap-0.5">
            <ServerActions id={server?.serverConfigData.id ?? ""} />
            <ServerActionDelete
              size="icon"
              id={server?.serverConfigData.id ?? ""}
              onDelete={() => navigate({ to: "/" })}
            />
          </span>
        </CardTitle>

        <Tabs defaultValue="overview">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="logs" disabled={server?.serverConfigData.status !== "running"}>
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CardContent className="h-[calc(100dvh-15rem)] min-h-0 space-y-4 overflow-hidden p-0">
              <ServerProperties config={server?.serverConfigData} className="h-full min-h-0" />
            </CardContent>
          </TabsContent>

          <TabsContent value="edit">
            <CardContent className="min-h-0 min-h-[calc(100dvh-15rem)] space-y-4 p-0">
              <UpdateServerForm config={server?.serverConfigData} className="h-full min-h-0" />
            </CardContent>
          </TabsContent>

          <TabsContent value="logs">
            <CardContent className="space-y-4 p-0">
              <ServerLogs key={id} id={id} className="h-[calc(100dvh-15rem)]" />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
