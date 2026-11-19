import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

type QueryErrorProps = {
  error: Error;
  onRetry?: () => void;
  title?: string;
};

export function QueryError({
  error,
  onRetry,
  title = "Failed to load data",
}: QueryErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 my-[20%] text-center">
      <AlertTriangleIcon className="text-destructive size-10" />

      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          {error.message || "Unexpected error"}
        </p>
      </div>

      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon className="size-4" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}