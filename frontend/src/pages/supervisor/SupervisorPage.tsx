import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useSupervisor } from "./hooks/useSupervisor";
import { SupervisorHeader, AgentOverviewArea, ConversationArea, PerformanceArea, ActionsArea } from "./components";

export function SupervisorPage() {
  const { state, lastUpdate, error, refresh, agents, conversations, performanceKpis, performanceEvolucion, actions } = useSupervisor();

  if (state === "loading") {
    return (
      <DashboardErrorBoundary>
        <DashboardShell header={<SupervisorHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
          <SkeletonGrid count={4} cols={2} />
        </DashboardShell>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<SupervisorHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
        <div className="space-y-6">
          <DashboardSection title="Asesores">
            <DashboardGrid cols={2}>
              <AgentOverviewArea agents={agents} state={state} error={error} onRetry={refresh} />
              <PerformanceArea kpis={performanceKpis} evolucion={performanceEvolucion} state={state} error={error} onRetry={refresh} />
            </DashboardGrid>
          </DashboardSection>

          <DashboardSection title="Supervisión">
            <ConversationArea conversations={conversations} state={state} error={error} onRetry={refresh} />
          </DashboardSection>

          <DashboardSection title="Operaciones">
            <ActionsArea actions={actions} state={state} error={error} onRetry={refresh} />
          </DashboardSection>
        </div>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
