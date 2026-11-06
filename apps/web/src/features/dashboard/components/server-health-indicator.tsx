import { HealthIndicator } from "@/components/ui/health-indicator";
import { useHealth } from "@/hooks/use-health";
import { useServerStatus } from "@/hooks/use-servers";

export function ServerHealthIndicator({
  id,
  enabled = true,
  renderBadge = false,
  className,
  ...props
}: { id?: string; enabled?: boolean } & Omit<
  React.ComponentProps<typeof HealthIndicator>,
  "label" | "pulseClass" | "alternateClass" | "badgeClass"
>) {
  const { data: status } = useServerStatus(id ?? "", enabled);
  const { compoundStatusToHealthTone, compoundStatusToOverallHealth } = useHealth();

  const healthTone = status ? compoundStatusToHealthTone(status) : undefined;
  const healthLabel = status ? compoundStatusToOverallHealth(status) : "Unknown";

  return (
    <HealthIndicator
      label={healthLabel}
      pulseClass={healthTone?.pulse}
      alternateClass={healthTone?.alternate}
      badgeClass={healthTone?.badge}
      renderBadge={renderBadge}
      className={className}
      {...props}
    />
  );
}
