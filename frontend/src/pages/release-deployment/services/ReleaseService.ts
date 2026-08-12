import type { ReleaseProvider } from "../providers/ReleaseProvider";
import type { ReleaseSummaryDTO, ReleaseDTO, DeploymentDTO, EnvironmentDTO, PipelineDTO, VersionDTO, RollbackDTO, DeploymentQueueDTO, ReleaseCalendarDTO } from "../dto/release.dto";

export interface ReleaseData {
  summary: ReleaseSummaryDTO; releases: ReleaseDTO[]; deployments: DeploymentDTO[];
  environments: EnvironmentDTO[]; pipelines: PipelineDTO[]; versions: VersionDTO[];
  rollbacks: RollbackDTO[]; queue: DeploymentQueueDTO[]; calendar: ReleaseCalendarDTO[];
}

export class ReleaseService {
  constructor(private provider: ReleaseProvider) {}

  async fetchAll(): Promise<ReleaseData> {
    const [summary, releases, deployments, environments, pipelines, versions, rollbacks, queue, calendar] = await Promise.all([
      this.provider.getSummary(), this.provider.getReleases(), this.provider.getDeployments(),
      this.provider.getEnvironments(), this.provider.getPipelines(), this.provider.getVersions(),
      this.provider.getRollbacks(), this.provider.getQueue(), this.provider.getCalendar(),
    ]);
    return { summary, releases, deployments, environments, pipelines, versions, rollbacks, queue, calendar };
  }
}
