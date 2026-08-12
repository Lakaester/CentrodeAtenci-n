export type ReleaseStatus = "planned" | "in_progress" | "completed" | "failed" | "cancelled";
export type DeploymentStatus = "pending" | "deploying" | "success" | "failed" | "rollback";
export type EnvironmentType = "production" | "staging" | "qa" | "development";
export type PipelineStatus = "running" | "waiting" | "success" | "failed" | "paused";
export type VersionType = "stable" | "candidate" | "beta" | "hotfix";
export type RollbackStatus = "executed" | "pending" | "cancelled";

export interface ReleaseSummaryDTO {
  totalReleases: number; successfulDeployments: number; failedDeployments: number;
  pendingDeployments: number; productionVersions: number; rollbackEvents: number;
  activePipelines: number; averageDeploymentTime: number;
}

export interface ReleaseDTO {
  id: string; name: string; version: string; status: ReleaseStatus;
  environment: EnvironmentType; manager: string; createdAt: string;
  completedAt: string | null; description: string;
}

export interface DeploymentDTO {
  id: string; releaseId: string; service: string; version: string;
  environment: EnvironmentType; status: DeploymentStatus;
  startedAt: string; finishedAt: string | null; duration: number | null;
}

export interface EnvironmentDTO {
  id: string; name: string; type: EnvironmentType; region: string;
  currentVersion: string; status: "healthy" | "degraded" | "down";
  lastDeployment: string;
}

export interface PipelineDTO {
  id: string; name: string; status: PipelineStatus; branch: string;
  commitSha: string; startedAt: string; duration: number | null;
  triggeredBy: string;
}

export interface VersionDTO {
  id: string; service: string; version: string; type: VersionType;
  environment: EnvironmentType; deployedAt: string; deployedBy: string;
}

export interface RollbackDTO {
  id: string; releaseId: string; service: string; fromVersion: string;
  toVersion: string; status: RollbackStatus; reason: string;
  executedAt: string | null; executedBy: string;
}

export interface DeploymentQueueDTO {
  id: string; service: string; version: string; environment: EnvironmentType;
  status: "queued" | "processing" | "completed" | "failed";
  enqueuedAt: string; startedAt: string | null;
}

export interface ReleaseCalendarDTO {
  id: string; title: string; date: string; type: "release" | "freeze" | "maintenance";
  environment: EnvironmentType; status: "scheduled" | "completed" | "cancelled";
}
