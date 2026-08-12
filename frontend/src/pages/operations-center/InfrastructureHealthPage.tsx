import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useInfrastructureHealth } from "./hooks/useInfrastructureHealth";
import { InfrastructureHeader, InfrastructureFilters, InfrastructureOverview, InfrastructureGrid } from "./components";

export function InfrastructureHealthPage() {
  const { state, lastUpdate, refresh, microservices, apis, featureFlags, deployments, queues, licenses, folios, regions } = useInfrastructureHealth();

  if (state === "loading") {
    return (
      <DashboardErrorBoundary>
        <DashboardShell header={<InfrastructureHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
          <SkeletonGrid count={8} cols={4} />
        </DashboardShell>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<InfrastructureHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
        <div className="space-y-6">
          <InfrastructureFilters />
          <DashboardSection title="Resumen">
            <InfrastructureOverview state={state} />
          </DashboardSection>
          <DashboardSection title="Infraestructura">
            <InfrastructureGrid
              state={state}
              microservices={microservices} apis={apis} featureFlags={featureFlags}
              deployments={deployments} queues={queues} licenses={licenses}
              folios={folios} regions={regions}
            />
          </DashboardSection>
        </div>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
