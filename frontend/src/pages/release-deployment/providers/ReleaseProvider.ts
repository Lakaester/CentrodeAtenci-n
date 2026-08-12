import type { ReleaseSummaryDTO, ReleaseDTO, DeploymentDTO, EnvironmentDTO, PipelineDTO, VersionDTO, RollbackDTO, DeploymentQueueDTO, ReleaseCalendarDTO } from "../dto/release.dto";

export interface ReleaseProvider {
  getSummary(): Promise<ReleaseSummaryDTO>;
  getReleases(): Promise<ReleaseDTO[]>;
  getDeployments(): Promise<DeploymentDTO[]>;
  getEnvironments(): Promise<EnvironmentDTO[]>;
  getPipelines(): Promise<PipelineDTO[]>;
  getVersions(): Promise<VersionDTO[]>;
  getRollbacks(): Promise<RollbackDTO[]>;
  getQueue(): Promise<DeploymentQueueDTO[]>;
  getCalendar(): Promise<ReleaseCalendarDTO[]>;
}
