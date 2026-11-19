import { InfoIcon } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type HealthIndicatorProps = {
  label: string;
  pulseClass?: string;
  alternateClass?: string;
  badgeClass?: string;
  renderBadge?: boolean;
  popoverContent?: React.ReactNode;
} & React.ComponentProps<typeof Badge>;

export function HealthIndicator({
  label,
  pulseClass = "bg-muted-foreground/50",
  alternateClass = "bg-muted-foreground/80",
  badgeClass = "bg-muted/80",
  renderBadge = false,
  popoverContent,
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

  return !popoverContent ? (
    <Badge className={cn("flex items-center gap-2", badgeClass, className)} {...props}>
      {indicator}
      <span className="text-xs">{label}</span>
    </Badge>
  ) : (
    <Popover>
      <PopoverTrigger
        render={
          <Badge
            className={cn(
              "flex items-center gap-2 hover:ring transition-all",
              badgeClass,
              className,
            )}
            {...props}
          >
            {indicator}
            <span className="text-xs">{label}</span>
            <InfoIcon />
          </Badge>
        }
      />
      <PopoverContent className="max-w-fit">{popoverContent}</PopoverContent>
    </Popover>
  );
}
