import { Spinner } from "@/components/ui/spinner";

export default function Pending() {
  return (
    <div className="flex flex-1 flex-row items-center justify-center gap-4 p-4 my-[25%]">
      <Spinner className="size-8" />
      <span className="text-muted-foreground">Loading…</span>
    </div>
  );
}