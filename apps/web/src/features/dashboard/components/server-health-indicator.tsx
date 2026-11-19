import { BotIcon, ContainerIcon, ServerIcon } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { HealthIndicator } from "@/components/ui/health-indicator";
import { ServerStatusBadge } from "@/features/dashboard/components/server-status-badge";
import { useHealth } from "@/hooks/use-health";
import { useServerStatus } from "@/hooks/use-servers";
import { useSeverity } from "@/hooks/use-severity";
import type { ServerStatusEnum } from "@/types/server";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: status, isPending, isError } = useServerStatus(id ?? "", enabled);
  const { statusToHealthTone, compoundStatusToHealthTone, compoundStatusToOverallHealth } = useHealth();

  const healthTone = status ? compoundStatusToHealthTone(status) : undefined;
  const healthLabel = status ? compoundStatusToOverallHealth(status) : "Unknown";
  const healthToneUnknown = statusToHealthTone("Unknown");

  if (isPending && !isError) {
    return (
      <Skeleton className="w-24 h-6 rounded-lg" />
    )
  }

  if (isError) {
    return (
      <HealthIndicator
        label="Unknown"
        pulseClass={healthToneUnknown.pulse}
        alternateClass={healthToneUnknown.alternate}
        badgeClass={healthToneUnknown.badge}
        renderBadge={renderBadge}
        className={className}
        {...props}
      />
    )
  }

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
          <ServerStatusBadge id={id ?? ""} enabled={enabled} resource="container" />

          <span className="flex items-center gap-1">
            <BotIcon size={16} />
            Agent
          </span>
          <ServerStatusBadge id={id ?? ""} enabled={enabled} resource="agent" />

          <span className="flex items-center gap-1">
            <ServerIcon size={16} />
            Reforger
          </span>
          <ServerStatusBadge id={id ?? ""} enabled={enabled} resource="reforger" />
        </div>
      }
    />
  );
}
