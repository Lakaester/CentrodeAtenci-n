import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useIncidentCommand } from "./hooks/useIncidentCommand";
import { IncidentCommandHeader, IncidentCommandFilters, IncidentOverview, IncidentGrid } from "./components";

export function IncidentCommandPage() {
  const { state, lastUpdate, refresh, summary, incidents, affectedServices, affectedCustomers, timeline, escalations, warRooms, communications, actions } = useIncidentCommand();

  if (state === "loading") {
    return (
      <DashboardErrorBoundary>
        <DashboardShell header={<IncidentCommandHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
          <SkeletonGrid count={8} cols={4} />
        </DashboardShell>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<IncidentCommandHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
        <div className="space-y-6">
          <IncidentCommandFilters />
          <DashboardSection title="Overview">
            <IncidentOverview summary={summary} state={state} />
          </DashboardSection>
          <DashboardSection title="Incident Management">
            <IncidentGrid
              state={state}
              incidents={incidents} affectedServices={affectedServices}
              affectedCustomers={affectedCustomers} timeline={timeline}
              escalations={escalations} warRooms={warRooms}
              communications={communications} actions={actions}
            />
          </DashboardSection>
        </div>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
