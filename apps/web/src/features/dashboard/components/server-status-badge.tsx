import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { serversQueryOptions, useServers, useServerStatus } from "@/hooks/use-servers";
import { useSeverity } from "@/hooks/use-severity";
import { cn } from "@/lib/utils";
import type { ServerStatusEnum } from "@/types/server";
import { useQuery } from "@tanstack/react-query";

export function ServerStatusBadge({
  id,
  enabled = true,
  resource = "container",
  className,
  ...props
}: { id: string, enabled?: boolean, resource?: "agent" | "container" | "reforger"} & React.ComponentProps<typeof Badge>) {
  const { data, isPending, isError } = useServerStatus(id ?? "", enabled)
  const { statusToSeverity } = useSeverity();

  if (isPending && !isError) {
    return (
      <Skeleton className="w-24 h-6 rounded-lg" />
    )
  }

  if (isError) {
    return (
      <Badge variant="muted" className={cn(className)} {...props}>
        unknown
      </Badge>
    )
  }

  const status = data[resource]
  return (
    <Badge variant={statusToSeverity(typeof status === "object" ? status.status : status)} className={cn(className)} {...props}>
      {typeof status === "object" ? status.status : status}
    </Badge>
  );
}
