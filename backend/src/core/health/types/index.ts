export type HealthStatus = "healthy" | "degraded" | "warning" | "unhealthy" | "offline" | "unknown";

export interface HealthCheck {
  name: string;
  component: string;
  status: HealthStatus;
  message?: string;
  durationMs: number;
  timestamp: string;
  metrics?: Record<string, number>;
}

export interface HealthReport {
  overall: HealthStatus;
  checks: HealthCheck[];
  healthy: number;
  degraded: number;
  warning: number;
  unhealthy: number;
  offline: number;
  total: number;
  timestamp: string;
}

export interface Heartbeat {
  component: string;
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptimeMs: number;
}

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}
