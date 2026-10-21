import { useQuery } from "@tanstack/react-query";
import { CopyIcon, InfoIcon, PenIcon, ServerIcon } from "lucide-react";
import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { CodeTextArea } from "@/components/ui/code-textarea";
import { serversQueryOptions } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";

function ServerInfoHeader({ id }: { id: string }) {
  return (
    <div className="flex align-middle">
      <div className="flex items-center gap-2">
        <InfoIcon />
        <span className="text-bold text-2xl">Server Details</span>
        <span>•</span>
        <Badge variant="outline" className="font-mono text-sm">
          {id}
        </Badge>
        <Button size="icon-xs" variant="ghost" render={<CopyIcon />} />
      </div>
    </div>
  );
}

function ServerInfoListItem({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "flex flex-row items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0",
        className,
      )}
      {...props}
    >
      {children}
    </li>
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

      <Card className="bg-muted/50 mx-auto mt-4 w-full flex-1 rounded-md p-4 align-middle md:min-h-min">
        <CardTitle>
          <div className="text-bold flex items-center gap-2 text-xl">
            <ServerIcon />
            {server?.serverConfigData.name}
            <code className="text-mono ml-4 flex gap-1 text-sm hover:border-b-2">
              <div className="">{server?.serverConfigData.bindAddress}</div>:
              <div className="">{server?.serverConfigData.bindPort}</div>
            </code>
          </div>
        </CardTitle>

        <CardDescription>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            <span className="text-sm">Online</span>
          </div>
        </CardDescription>

        <CardContent className="flex flex-1 gap-2 p-0">
          <ul className="bg-background flex flex-1 flex-col rounded-md border">
            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">Status</span>
                <Badge className="">{server?.serverConfigData.status}</Badge>
              </div>
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">IP Address</span>
                <code className="text-sm">{server?.serverConfigData.bindAddress}</code>
              </div>
              <Button size="icon-xs" variant="ghost" render={<CopyIcon />} />
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">Bind Port</span>
                <code className="text-sm">{server?.serverConfigData.bindPort}</code>
              </div>
              <Button size="icon-xs" variant="ghost" render={<CopyIcon />} />
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">A2S Port</span>
                <code className="text-sm">{server?.serverConfigData.a2sPort}</code>
              </div>
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">RCON Port</span>
                <code className="text-sm">{server?.serverConfigData.rconPort}</code>
              </div>
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">Launch Options</span>
                <code className="bg-muted/50 rounded-md p-1 text-xs">
                  {server?.serverConfigData.commandLine?.map((s, i) => (
                    <code key={i}>{s},</code>
                  ))}
                </code>
              </div>
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">
                  Process Environment
                </span>
                <code className="text-sm">env</code>
              </div>
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">Extra Ports</span>
                <code className="text-sm">{server?.serverConfigData.extraPorts}</code>
              </div>
            </ServerInfoListItem>

            <ServerInfoListItem>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium">Container ID</span>
                <code className="text-sm">{server?.serverConfigData.containerId}</code>
              </div>
              <Button size="icon-xs" variant="ghost" render={<CopyIcon />} />
            </ServerInfoListItem>
          </ul>

          <div className="flex-1">
            <CodeTextArea
              lang="json"
              value={JSON.stringify(server?.serverConfigData.reforgerConfig)}
              onChange={(value) => console.log(value)}
              minHeight="100%"
              className="h-full"
            />
          </div>
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
