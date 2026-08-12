import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import type { SummaryUI } from "../mappers/globalAlert.mapper";
import type { AlertCenterState } from "../hooks/useGlobalAlertCenter";

interface Props { summary: SummaryUI | null; state: AlertCenterState }

const ITEMS: { key: keyof SummaryUI; label: string; color: string }[] = [
  { key: "criticalAlerts", label: "Critical Alerts", color: "text-danger" },
  { key: "activeIncidents", label: "Active Incidents", color: "text-warning" },
  { key: "infrastructureAlerts", label: "Infrastructure Alerts", color: "text-purple" },
  { key: "queueAlerts", label: "Queue Alerts", color: "text-cyan-600" },
  { key: "billingAlerts", label: "Billing Alerts", color: "text-warning" },
  { key: "deploymentAlerts", label: "Deployment Alerts", color: "text-primary" },
  { key: "slaBreaches", label: "SLA Breaches", color: "text-danger" },
  { key: "systemNotifications", label: "System Notifications", color: "text-black-45" },
];

export function GlobalAlertCenterOverview({ summary, state }: Props) {
  if (state !== "success" || !summary) return null;
  return (
    <DashboardGrid cols={4}>
      {ITEMS.map((item) => {
        const val = summary[item.key];
        return (
          <div key={item.key} className="rounded-lg border border-black-10 bg-white p-4 ">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${item.color}`}>{typeof val === "number" ? val.toLocaleString() : val}</p>
          </div>
        );
      })}
    </DashboardGrid>
  );
}
