import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/providers/settings-provider";
import { useServerStatus } from "@/hooks/use-servers";
import { useSeverity } from "@/hooks/use-severity";
import { cn } from "@/lib/utils";

export function ServerStatusBadge({
  id,
  resource = "container",
  className,
  ...props
}: {
  id: string;
  enabled?: boolean;
  resource?: "agent" | "container" | "reforger";
} & React.ComponentProps<typeof Badge>) {
  const { settings } = useSettings();
  const { data, isPending, isError } = useServerStatus(
    id,
    id.length > 0 && settings.queries.pollingEnabled,
  );
  const { statusToSeverity } = useSeverity();

  if (isPending && !isError) {
    return <Skeleton className="h-6 w-24 rounded-lg" />;
  }

  if (isError) {
    return (
      <Badge variant="muted" className={cn(className)} {...props}>
        unknown
      </Badge>
    );
  }

  const status = data[resource];
  return (
    <Badge
      variant={statusToSeverity(typeof status === "object" ? status.status : status)}
      className={cn(className)}
      {...props}
    >
      {typeof status === "object" ? status.status : status}
    </Badge>
  );
}
