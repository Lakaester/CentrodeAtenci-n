export interface HealthCheck {
  name: string;
  status: "ok" | "error" | "degraded";
  message?: string;
  timestamp: string;
  durationMs?: number;
}

export interface HealthReport {
  overall: "ok" | "error" | "degraded";
  checks: HealthCheck[];
  timestamp: string;
}
