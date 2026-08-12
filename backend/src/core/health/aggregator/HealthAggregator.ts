import { HealthRegistry } from "../registry/HealthRegistry";
import type { HealthReport, HealthStatus } from "../types";

export class HealthAggregator {
  constructor(private registry: HealthRegistry) {}

  async generateReport(): Promise<HealthReport> {
    const checks = await Promise.all(
      this.registry.list().map(async ({ name, fn }) => {
        try { return await fn(); } catch {
          return { name, component: "unknown", status: "unhealthy" as HealthStatus, message: "Check threw exception", durationMs: 0, timestamp: new Date().toISOString() };
        }
      }),
    );

    const total = checks.length;
    const healthy = checks.filter((c) => c.status === "healthy").length;
    const degraded = checks.filter((c) => c.status === "degraded").length;
    const warning = checks.filter((c) => c.status === "warning").length;
    const unhealthy = checks.filter((c) => c.status === "unhealthy").length;
    const offline = checks.filter((c) => c.status === "offline").length;

    let overall: HealthStatus = "healthy";
    if (unhealthy > 0 || offline > 0) overall = "unhealthy";
    else if (degraded > 0) overall = "degraded";
    else if (warning > 0) overall = "warning";

    return { overall, checks, healthy, degraded, warning, unhealthy, offline, total, timestamp: new Date().toISOString() };
  }
}
