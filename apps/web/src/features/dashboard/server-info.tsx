import { useQuery } from "@tanstack/react-query";
import { InfoIcon, PenIcon, ServerIcon } from "lucide-react";
import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { CopyTextButton } from "@/components/ui/copy-to-clipboard";
import { ServerHealthIndicator } from "@/features/dashboard/components/server-health-indicator";
import { ServerProperties } from "@/features/dashboard/components/server-properties";
import { useIsMobile } from "@/hooks/use-mobile";
import { serversQueryOptions } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";

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
  const { data: server } = useQuery({
    ...serversQueryOptions(),
    select: (data) => data.data.find((s) => id === s.serverConfigData.id),
  });

  return (
    <div className={cn(className)} {...props}>
      <ServerInfoHeader id={id} />

      <Card className="mt-4 w-full rounded-md p-4 align-middle md:mx-auto md:min-h-min md:flex-1">
        <CardTitle className="text-bold flex items-center gap-2 text-xl">
          <ServerIcon />
          {server?.serverConfigData.name}
          <ServerHealthIndicator
            renderBadge={true}
            id={server?.serverConfigData.id ?? ""}
            className="ml-2"
          />
        </CardTitle>

        <CardDescription>
          <code className="text-mono flex gap-1 text-sm">
            <div className="">{server?.serverConfigData.bindAddress}</div>:
            <div className="">{server?.serverConfigData.bindPort}</div>
          </code>
        </CardDescription>

        <CardContent className="p-0">
          <ServerProperties config={server?.serverConfigData} />
        </CardContent>

        <CardFooter className="w-full">
          <div className="flex flex-1 flex-col items-end align-middle">
            <Button>
              <PenIcon />
              Update
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
