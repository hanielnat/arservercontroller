import { Spinner } from "@/components/ui/spinner";

export default function Pending() {
  return (
    <div className="my-[25%] flex flex-1 flex-row items-center justify-center gap-4 p-4">
      <Spinner className="size-8" />
      <span className="shimmer text-muted-foreground shimmer-duration-1000">Loading…</span>
    </div>
  );
}
