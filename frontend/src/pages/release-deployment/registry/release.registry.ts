import type { ReleaseStatus, DeploymentStatus, EnvironmentType, PipelineStatus, VersionType, RollbackStatus } from "../dto/release.dto";

export const RELEASE_STATUS_CONFIG: Record<ReleaseStatus, { label: string; color: string; order: number }> = {
  planned:     { label: "Planned",     color: "text-primary bg-primary-5",       order: 0 },
  in_progress: { label: "In Progress", color: "text-warning bg-warning-5",     order: 1 },
  completed:   { label: "Completed",   color: "text-success bg-success-5", order: 2 },
  failed:      { label: "Failed",      color: "text-danger bg-danger-5",       order: 3 },
  cancelled:   { label: "Cancelled",   color: "text-black-45 bg-black-5",    order: 4 },
};

export const DEPLOYMENT_STATUS_CONFIG: Record<DeploymentStatus, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "text-black-45 bg-black-5" },
  deploying: { label: "Deploying", color: "text-primary bg-primary-5" },
  success:   { label: "Success",   color: "text-success bg-success-5" },
  failed:    { label: "Failed",    color: "text-danger bg-danger-5" },
  rollback:  { label: "Rollback",  color: "text-warning bg-warning-5" },
};

export const ENVIRONMENT_CONFIG: Record<EnvironmentType, { label: string; color: string }> = {
  production:  { label: "Production",  color: "text-danger bg-danger-5" },
  staging:     { label: "Staging",     color: "text-warning bg-warning-5" },
  qa:          { label: "QA",          color: "text-primary bg-primary-5" },
  development: { label: "Development", color: "text-black-45 bg-black-5" },
};

export const PIPELINE_STATUS_CONFIG: Record<PipelineStatus, { label: string; color: string }> = {
  running: { label: "Running", color: "text-primary bg-primary-5" },
  waiting: { label: "Waiting", color: "text-black-45 bg-black-5" },
  success: { label: "Success", color: "text-success bg-success-5" },
  failed:  { label: "Failed",  color: "text-danger bg-danger-5" },
  paused:  { label: "Paused",  color: "text-warning bg-warning-5" },
};

export const VERSION_TYPE_CONFIG: Record<VersionType, { label: string; color: string }> = {
  stable:    { label: "Stable",    color: "text-success bg-success-5" },
  candidate: { label: "Candidate", color: "text-warning bg-warning-5" },
  beta:      { label: "Beta",      color: "text-primary bg-primary-5" },
  hotfix:    { label: "Hotfix",    color: "text-danger bg-danger-5" },
};

export const ROLLBACK_STATUS_CONFIG: Record<RollbackStatus, { label: string; color: string }> = {
  executed: { label: "Executed", color: "text-warning bg-warning-5" },
  pending:  { label: "Pending",  color: "text-primary bg-primary-5" },
  cancelled:{ label: "Cancelled",color: "text-black-45 bg-black-5" },
};
