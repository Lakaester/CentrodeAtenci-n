import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useCollaboration } from "./hooks/useCollaboration";
import { CollaborationHeader, ActivityArea, NotesArea, MentionsArea, FollowersArea, TimelineArea } from "./components";

export function CollaborationPage() {
  const { state, lastUpdate, error, refresh, activity, notes, mentions, followers, timeline } = useCollaboration();

  if (state === "loading") {
    return (
      <DashboardErrorBoundary>
        <DashboardShell header={<CollaborationHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
          <SkeletonGrid count={6} cols={2} />
        </DashboardShell>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<CollaborationHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}>
        <div className="space-y-6">
          <DashboardSection title="Actividad">
            <DashboardGrid cols={2}>
              <ActivityArea activity={activity} state={state} error={error} onRetry={refresh} />
              <TimelineArea timeline={timeline} state={state} error={error} onRetry={refresh} />
            </DashboardGrid>
          </DashboardSection>

          <DashboardSection title="Colaboración">
            <DashboardGrid cols={3}>
              <NotesArea notes={notes} state={state} error={error} onRetry={refresh} />
              <MentionsArea mentions={mentions} state={state} error={error} onRetry={refresh} />
              <FollowersArea followers={followers} state={state} error={error} onRetry={refresh} />
            </DashboardGrid>
          </DashboardSection>
        </div>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
