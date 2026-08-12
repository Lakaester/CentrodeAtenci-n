import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import type { HealthState } from "../hooks/useInfrastructureHealth";

const ITEMS = ["Microservices", "APIs", "Feature Flags", "Deployments", "Queues", "Licenses", "Folios", "Uptime"];

interface Props { state: HealthState }

export function InfrastructureOverview({ state }: Props) {
  if (state !== "success") return null;

  return (
    <DashboardGrid cols={4}>
      {ITEMS.map((label) => (
        <div key={label} className="rounded-lg border border-dashed border-black-10 bg-white/50 p-4 text-center text-xs text-black-25">
          {label}
        </div>
      ))}
    </DashboardGrid>
  );
}
