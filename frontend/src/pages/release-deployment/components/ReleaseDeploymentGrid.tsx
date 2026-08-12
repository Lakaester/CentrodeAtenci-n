import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { ReleaseStatusWidget } from "./widgets/ReleaseStatusWidget";
import { DeploymentHistoryWidget } from "./widgets/DeploymentHistoryWidget";
import { EnvironmentStatusWidget } from "./widgets/EnvironmentStatusWidget";
import { PipelineStatusWidget } from "./widgets/PipelineStatusWidget";
import { CurrentVersionsWidget } from "./widgets/CurrentVersionsWidget";
import { RollbackHistoryWidget } from "./widgets/RollbackHistoryWidget";
import { DeploymentQueueWidget } from "./widgets/DeploymentQueueWidget";
import { ReleaseCalendarWidget } from "./widgets/ReleaseCalendarWidget";
import type { ReleaseUI, DeploymentUI, EnvironmentUI, PipelineUI, VersionUI, RollbackUI, QueueUI, CalendarUI } from "../mappers/release.mapper";
import type { ReleaseState } from "../hooks/useReleaseDeployment";

interface Props {
  state: ReleaseState;
  releases: ReleaseUI[]; deployments: DeploymentUI[]; environments: EnvironmentUI[];
  pipelines: PipelineUI[]; versions: VersionUI[]; rollbacks: RollbackUI[];
  queue: QueueUI[]; calendar: CalendarUI[];
}

export function ReleaseDeploymentGrid({ state, releases, deployments, environments, pipelines, versions, rollbacks, queue, calendar }: Props) {
  return (
    <DashboardGrid cols={4}>
      <ReleaseStatusWidget items={releases} state={state} />
      <DeploymentHistoryWidget items={deployments} state={state} />
      <EnvironmentStatusWidget items={environments} state={state} />
      <PipelineStatusWidget items={pipelines} state={state} />
      <CurrentVersionsWidget items={versions} state={state} />
      <RollbackHistoryWidget items={rollbacks} state={state} />
      <DeploymentQueueWidget items={queue} state={state} />
      <ReleaseCalendarWidget items={calendar} state={state} />
    </DashboardGrid>
  );
}
