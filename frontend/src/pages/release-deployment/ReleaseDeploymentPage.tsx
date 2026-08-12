import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useReleaseDeployment } from "./hooks/useReleaseDeployment";
import { ReleaseDeploymentHeader, ReleaseDeploymentFilters, ReleaseDeploymentOverview, ReleaseDeploymentGrid } from "./components";

export function ReleaseDeploymentPage() {
  const { state, lastUpdate, refresh, summary, releases, deployments, environments, pipelines, versions, rollbacks, queue, calendar } = useReleaseDeployment();

  if (state === "loading") {
    return (
      <DashboardErrorBoundary>
        <DashboardShell header={<ReleaseDeploymentHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
          <SkeletonGrid count={8} cols={4} />
        </DashboardShell>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<ReleaseDeploymentHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
        <div className="space-y-6">
          <ReleaseDeploymentFilters />
          <DashboardSection title="Overview">
            <ReleaseDeploymentOverview summary={summary} state={state} />
          </DashboardSection>
          <DashboardSection title="Release Management">
            <ReleaseDeploymentGrid
              state={state} releases={releases} deployments={deployments}
              environments={environments} pipelines={pipelines} versions={versions}
              rollbacks={rollbacks} queue={queue} calendar={calendar}
            />
          </DashboardSection>
        </div>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
