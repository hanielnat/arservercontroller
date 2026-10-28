import { Badge } from "@/components/ui/badge";
import { useSeverity } from "@/hooks/use-severity";
import { cn } from "@/lib/utils";
import type { ServerStatusEnum } from "@/types/server";

export function ServerStatusBadge({
  status,
  className,
  ...props
}: { status: ServerStatusEnum } & React.ComponentProps<typeof Badge>) {
  const { statusToSeverity } = useSeverity();
  return (
    <Badge variant={statusToSeverity(status)} className={cn(className)} {...props}>
      {status}
    </Badge>
  );
}
