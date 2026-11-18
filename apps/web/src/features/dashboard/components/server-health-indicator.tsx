import { BotIcon, ContainerIcon, ServerIcon } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { HealthIndicator } from "@/components/ui/health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import { useHealth } from "@/hooks/use-health";
import { useServerStatus } from "@/hooks/use-servers";
import { useSeverity } from "@/hooks/use-severity";
import type { ServerStatusEnum } from "@/types/server";

export function ServerHealthIndicator({
  id,
  enabled = true,
  renderBadge = false,
  showTooltip = false,
  className,
  ...props
}: { id?: string; enabled?: boolean; showTooltip?: boolean } & Omit<
  React.ComponentProps<typeof HealthIndicator>,
  "label" | "pulseClass" | "alternateClass" | "badgeClass"
>) {
  const { data: status } = useServerStatus(id ?? "", enabled);
  const { statusToSeverity } = useSeverity();
  const { compoundStatusToHealthTone, compoundStatusToOverallHealth } = useHealth();

  const healthTone = status ? compoundStatusToHealthTone(status) : undefined;
  const healthLabel = status ? compoundStatusToOverallHealth(status) : "Unknown";

  if (!showTooltip) {
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

  return (
    <HealthIndicator
      label={healthLabel}
      pulseClass={healthTone?.pulse}
      alternateClass={healthTone?.alternate}
      badgeClass={healthTone?.badge}
      renderBadge={renderBadge}
      className={className}
      {...props}
      popoverContent={
        <div className="grid max-w-fit grid-cols-[max-content_minmax(0,1fr)] items-center gap-2">
          <span className="flex items-center gap-1">
            <ContainerIcon size={16} />
            Container
          </span>
          <ServerStatusBadge status={status?.container as ServerStatusEnum} />

          <span className="flex items-center gap-1">
            <BotIcon size={16} />
            Agent
          </span>
          <ServerStatusBadge status={status?.agent as ServerStatusEnum} />

          <span className="flex items-center gap-1">
            <ServerIcon size={16} />
            Reforger
          </span>
          <Badge
            variant={statusToSeverity((status?.reforger.status ?? "dead") as ServerStatusEnum)}
          >
            {JSON.stringify(status?.reforger, null, 2)}
          </Badge>
        </div>
      }
    />
  );
}
