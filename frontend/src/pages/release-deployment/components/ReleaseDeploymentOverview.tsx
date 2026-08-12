import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import type { SummaryUI } from "../mappers/release.mapper";
import type { ReleaseState } from "../hooks/useReleaseDeployment";

interface Props { summary: SummaryUI | null; state: ReleaseState }

const ITEMS: { key: keyof SummaryUI; label: string; color: string; suffix?: string }[] = [
  { key: "totalReleases", label: "Total Releases", color: "text-black-85" },
  { key: "successfulDeployments", label: "Successful Deployments", color: "text-success" },
  { key: "failedDeployments", label: "Failed Deployments", color: "text-danger" },
  { key: "pendingDeployments", label: "Pending Deployments", color: "text-warning" },
  { key: "productionVersions", label: "Production Versions", color: "text-black-85" },
  { key: "rollbackEvents", label: "Rollback Events", color: "text-warning" },
  { key: "activePipelines", label: "Active Pipelines", color: "text-primary" },
  { key: "averageDeploymentTime", label: "Avg Deployment Time", color: "text-black-85" },
];

export function ReleaseDeploymentOverview({ summary, state }: Props) {
  if (state !== "success" || !summary) return null;
  return (
    <DashboardGrid cols={4}>
      {ITEMS.map((item) => {
        const val = summary[item.key];
        return (
          <div key={item.key} className="rounded-lg border border-black-10 bg-white p-4 ">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${item.color}`}>{typeof val === "number" ? val.toLocaleString() : val}{item.suffix ?? ""}</p>
          </div>
        );
      })}
    </DashboardGrid>
  );
}
