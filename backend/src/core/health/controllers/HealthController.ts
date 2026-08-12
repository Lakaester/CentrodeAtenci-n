import { Request, Response, NextFunction } from "express";
import { HealthRegistry } from "../registry/HealthRegistry";
import { HealthAggregator } from "../aggregator/HealthAggregator";
import { HeartbeatService } from "../heartbeat/HeartbeatService";
import { coreChecks } from "../checks/CoreChecks";

const registry = new HealthRegistry();
const aggregator = new HealthAggregator(registry);
const heartbeat = new HeartbeatService();

// Register core checks
registry.register("api", coreChecks.checkApi);
registry.register("event-bus", coreChecks.checkEventBus);
registry.register("memory", coreChecks.checkMemory);
registry.register("uptime", coreChecks.checkUptime);

export const healthController = {
  async report(_req: Request, res: Response, next: NextFunction) {
    try {
      heartbeat.beat("health-api");
      const report = await aggregator.generateReport();
      res.json({ ok: true, data: report });
    } catch (err) { next(err); }
  },

  async liveness(_req: Request, res: Response, next: NextFunction) {
    try {
      heartbeat.beat("liveness");
      res.json({ ok: true, status: "alive", uptimeMs: Date.now() - process.uptime() * 1000 });
    } catch (err) { next(err); }
  },

  async readiness(_req: Request, res: Response, next: NextFunction) {
    try {
      const report = await aggregator.generateReport();
      const ready = report.overall !== "unhealthy";
      res.status(ready ? 200 : 503).json({ ok: ready, status: ready ? "ready" : "not ready", report });
    } catch (err) { next(err); }
  },

  async heartbeats(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: heartbeat.list() }); } catch (err) { next(err); }
  },
};
