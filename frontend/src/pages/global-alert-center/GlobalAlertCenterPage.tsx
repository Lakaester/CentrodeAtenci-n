import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useGlobalAlertCenter } from "./hooks/useGlobalAlertCenter";
import { GlobalAlertCenterHeader, GlobalAlertCenterFilters, GlobalAlertCenterOverview, GlobalAlertCenterGrid } from "./components";

export function GlobalAlertCenterPage() {
  const { state, lastUpdate, refresh, summary, critical, incidents, infra, queues, billing, deploy, sla, notifications } = useGlobalAlertCenter();

  if (state === "loading") return (<DashboardErrorBoundary><DashboardShell header={<GlobalAlertCenterHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}><SkeletonGrid count={8} cols={4} /></DashboardShell></DashboardErrorBoundary>);

  return (<DashboardErrorBoundary><DashboardShell header={<GlobalAlertCenterHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}><div className="space-y-6"><GlobalAlertCenterFilters /><DashboardSection title="Overview"><GlobalAlertCenterOverview summary={summary} state={state} /></DashboardSection><DashboardSection title="Alerts"><GlobalAlertCenterGrid state={state} critical={critical} incidents={incidents} infra={infra} queues={queues} billing={billing} deploy={deploy} sla={sla} notifications={notifications} /></DashboardSection></div></DashboardShell></DashboardErrorBoundary>);
}
