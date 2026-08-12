export type HealthStatus = "healthy" | "warning" | "critical" | "maintenance";
export type Environment = "production" | "staging" | "qa" | "development";
export type DeploymentStatus = "success" | "failed" | "in-progress" | "rolled-back";
export type LicenseStatus = "active" | "expiring" | "expired";
export type QueueStatus = "running" | "paused" | "degraded";

export interface InfrastructureSummaryDTO {
  totalMicroservices: number;
  healthyApis: number;
  featureFlags: number;
  deploymentsToday: number;
  activeQueues: number;
  activeLicenses: number;
  foliosAvailable: number;
  globalUptime: number;
}

export interface MicroserviceDTO {
  id: string; name: string; status: HealthStatus;
  version: string; uptime: number; latency: number;
  cpuUsage: number; memoryUsage: number;
  region: string; lastDeployment: string; lastHeartbeat: string;
}

export interface ApiHealthDTO {
  id: string; name: string; endpoint: string;
  status: HealthStatus; responseTime: number;
  availability: number; lastCheck: string;
}

export interface FeatureFlagDTO {
  id: string; name: string; environment: Environment;
  enabled: boolean; rolloutPercentage: number;
  owner: string; lastUpdated: string;
}

export interface DeploymentDTO {
  id: string; service: string; version: string;
  environment: Environment; status: DeploymentStatus;
  startedAt: string; finishedAt: string | null; duration: number | null;
}

export interface QueueDTO {
  id: string; name: string;
  pendingMessages: number; processingMessages: number; failedMessages: number;
  avgProcessingTime: number; status: QueueStatus;
}

export interface LicenseDTO {
  id: string; customer: string; licenseType: string;
  expirationDate: string; status: LicenseStatus; daysRemaining: number;
}

export interface FolioDTO {
  id: string; company: string;
  available: number; used: number; remaining: number; status: HealthStatus;
}

export interface RegionDTO {
  id: string; country: string; region: string;
  status: HealthStatus; activeServices: number;
}
