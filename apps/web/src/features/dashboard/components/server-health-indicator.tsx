import { Badge } from "@/components/ui/badge";
import { useHealth } from "@/hooks/use-health";
import { useServerStatus } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";

export function ServerHealthIndicator({
  id,
  enabled = true,
  renderBadge = false,
  className,
  ...props
}: { id: string; enabled?: boolean; renderBadge?: boolean } & React.ComponentProps<typeof Badge>) {
  const { data: status } = useServerStatus(id, enabled);
  const { compoundStatusToHealthTone, compoundStatusToOverallHealth } = useHealth();

  const healthTone = status ? compoundStatusToHealthTone(status) : undefined;
  const healthLabel = status ? compoundStatusToOverallHealth(status) : "Unknown";

  const pulseClass = healthTone?.pulse ?? "bg-muted-foreground/50";
  const alternateClass = healthTone?.alternate ?? "bg-muted-foreground/80";
  const badgeClass = healthTone?.badge ?? "bg-muted/80";

  const withIndicator = () => (
    <span
      className={cn("flex size-2 items-center justify-center", renderBadge ? undefined : className)}
    >
      <span className={cn("absolute size-2 animate-ping rounded-full", pulseClass)} />
      <span className={cn("relative size-2 rounded-full", alternateClass)} />
    </span>
  );

  const withBadge = () => (
    <Badge className={cn("flex items-center gap-2", badgeClass, className)} {...props}>
      {withIndicator()}
      <span className="text-xs">{healthLabel}</span>
    </Badge>
  );

  return <>{renderBadge ? withBadge() : withIndicator()}</>;
}
