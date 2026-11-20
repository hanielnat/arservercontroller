import { Link } from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="
      flex min-h-dvh w-full flex-col items-center justify-center gap-4 p-8 text-center
    "
    >
      <AlertTriangleIcon className="size-10 text-warning-foreground" />
      <div>
        <h2 className="text-lg font-semibold">Page not found</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or may have moved.
        </p>
      </div>

      <Button variant="outline" render={<Link to="/">Go to dashboard</Link>} />
    </div>
  );
}
