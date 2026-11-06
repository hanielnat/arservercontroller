import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HealthIndicatorProps = {
  label: string;
  pulseClass?: string;
  alternateClass?: string;
  badgeClass?: string;
  renderBadge?: boolean;
} & React.ComponentProps<typeof Badge>;

export function HealthIndicator({
  label,
  pulseClass = "bg-muted-foreground/50",
  alternateClass = "bg-muted-foreground/80",
  badgeClass = "bg-muted/80",
  renderBadge = false,
  className,
  ...props
}: HealthIndicatorProps) {
  const indicator = (
    <span
      className={cn(
        "relative flex size-2 items-center justify-center",
        renderBadge ? undefined : className,
      )}
    >
      <span className={cn("absolute size-2 animate-ping rounded-full", pulseClass)} />
      <span className={cn("relative size-2 rounded-full", alternateClass)} />
    </span>
  );

  if (!renderBadge) {
    return indicator;
  }

  return (
    <Badge className={cn("flex items-center gap-2", badgeClass, className)} {...props}>
      {indicator}
      <span className="text-xs">{label}</span>
    </Badge>
  );
}
