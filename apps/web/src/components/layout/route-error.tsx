import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";

type RouteErrorProps = {
  error: Error;
  reset?: () => void;
};

export function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 my-[20%] text-center">
      <AlertTriangleIcon className="text-destructive size-10" />
      <div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          {error.message || "Unexpected error"}
        </p>
      </div>
      {reset ? (
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}