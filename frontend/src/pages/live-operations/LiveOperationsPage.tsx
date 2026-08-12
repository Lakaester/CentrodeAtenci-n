import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useLiveOperations } from "./hooks/useLiveOperations";
import { LiveHeader, OperationalArea, MonitoringArea, QueueArea, AlertArea } from "./components";

export function LiveOperationsPage() {
  const { state, lastUpdate, error, refresh, kpis, charts, queue, agents, alerts } = useLiveOperations();

  if (state === "loading") {
    return (
      <DashboardErrorBoundary>
        <DashboardShell header={<LiveHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
          <SkeletonGrid count={6} cols={2} />
        </DashboardShell>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<LiveHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
        <div className="space-y-6">
          <OperationalArea kpis={kpis} state={state} error={error} onRetry={refresh} />

          <DashboardSection title="Monitoreo y cola">
            <DashboardGrid cols={2}>
              <MonitoringArea charts={charts} state={state} error={error} />
              <QueueArea queue={queue} agents={agents} state={state} error={error} onRetry={refresh} />
            </DashboardGrid>
          </DashboardSection>

          <DashboardSection title="Alertas">
            <AlertArea alerts={alerts} state={state} error={error} onRetry={refresh} />
          </DashboardSection>
        </div>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
