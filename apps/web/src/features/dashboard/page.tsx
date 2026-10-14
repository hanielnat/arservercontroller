import DashboardOverview from "./overview";

export default function DashboardContent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardOverview />
    </div>
  );
}
