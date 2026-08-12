import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useQueueIntelligence } from "./hooks/useQueueIntelligence";
import { QueueIntelligenceHeader, QueueIntelligenceFilters, QueueIntelligenceOverview, QueueIntelligenceGrid } from "./components";

export function QueueIntelligencePage() {
  const { state, lastUpdate, refresh, summary, queues, backlogs, throughputs, consumers, producers, retryQueues, deadLetterQueues, latencies } = useQueueIntelligence();

  if (state === "loading") return (<DashboardErrorBoundary><DashboardShell header={<QueueIntelligenceHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}><SkeletonGrid count={8} cols={4} /></DashboardShell></DashboardErrorBoundary>);

  return (<DashboardErrorBoundary><DashboardShell header={<QueueIntelligenceHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}><div className="space-y-6"><QueueIntelligenceFilters /><DashboardSection title="Overview"><QueueIntelligenceOverview summary={summary} state={state} /></DashboardSection><DashboardSection title="Queues"><QueueIntelligenceGrid
    state={state} queues={queues} backlogs={backlogs} throughputs={throughputs}
    consumers={consumers} producers={producers} retryQueues={retryQueues}
    deadLetterQueues={deadLetterQueues} latencies={latencies}
  /></DashboardSection></div></DashboardShell></DashboardErrorBoundary>);
}
