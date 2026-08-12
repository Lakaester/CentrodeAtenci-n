import type { HealthCheck } from "../types";

export const coreChecks = {
  async checkApi(): Promise<HealthCheck> {
    const start = Date.now();
    return { name: "api", component: "core", status: "healthy", message: "API funcionando", durationMs: Date.now() - start, timestamp: new Date().toISOString() };
  },

  async checkEventBus(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const { getEventBus } = await import("../../events/bootstrap");
      const bus = getEventBus();
      return { name: "event-bus", component: "core", status: "healthy", message: `${bus.list().length} suscripciones activas`, durationMs: Date.now() - start, timestamp: new Date().toISOString() };
    } catch (err: unknown) {
      return { name: "event-bus", component: "core", status: "unhealthy", message: err instanceof Error ? err.message : "Error", durationMs: Date.now() - start, timestamp: new Date().toISOString() };
    }
  },

  async checkMemory(): Promise<HealthCheck> {
    const start = Date.now();
    const used = process.memoryUsage();
    const heapPercent = Math.round((used.heapUsed / used.heapTotal) * 100);
    const status = heapPercent > 90 ? "warning" : heapPercent > 80 ? "degraded" : "healthy";
    return {
      name: "memory", component: "core", status, message: `Heap: ${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB (${heapPercent}%)`,
      durationMs: Date.now() - start, timestamp: new Date().toISOString(), metrics: { heapUsedMb: Math.round(used.heapUsed / 1024 / 1024), heapTotalMb: Math.round(used.heapTotal / 1024 / 1024), heapPercent },
    };
  },

  async checkUptime(): Promise<HealthCheck> {
    const start = Date.now();
    return { name: "uptime", component: "core", status: "healthy", message: `${Math.round(process.uptime() / 60)} minutos`, durationMs: Date.now() - start, timestamp: new Date().toISOString(), metrics: { uptimeMinutes: Math.round(process.uptime() / 60) } };
  },
};
