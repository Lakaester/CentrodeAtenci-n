import { PlatformLogger } from "../platform/logger/services/PlatformLogger";
import { AuditService } from "../platform/audit/services/AuditService";
import { TimelineService } from "../platform/timeline/services/TimelineService";
import { HeartbeatService } from "../health/heartbeat/HeartbeatService";
import type { HealthReport } from "../health/types";
import { randomUUID } from "crypto";

export type EventCategory = "domain" | "platform" | "infrastructure";

export interface ObservableEvent {
  id: string;
  type: EventCategory;
  source: string;
  version: string;
  correlationId: string;
  requestId: string;
  timestamp: string;
  payload: unknown;
}

/**
 * ObservabilityService — Punto único para emitir eventos de observabilidad.
 * Integra Logger, Audit, Timeline, Health y Heartbeat bajo un mismo contrato.
 */
export class ObservabilityService {
  logger = new PlatformLogger();
  audit = new AuditService();
  timeline = new TimelineService();
  heartbeat = new HeartbeatService();

  emit(event: Omit<ObservableEvent, "id" | "timestamp">): void {
    const full: ObservableEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.logger.info(`[${event.type}] ${event.source}: ${JSON.stringify(event.payload)}`, {
      correlationId: event.correlationId,
      requestId: event.requestId,
    });
  }

  async generateHealthReport(): Promise<HealthReport> {
    const { HealthAggregator } = await import("../health/aggregator/HealthAggregator");
    const { HealthRegistry } = await import("../health/registry/HealthRegistry");
    const { coreChecks } = await import("../health/checks/CoreChecks");

    const registry = new HealthRegistry();
    registry.register("api", coreChecks.checkApi);
    registry.register("memory", coreChecks.checkMemory);
    registry.register("uptime", coreChecks.checkUptime);

    const aggregator = new HealthAggregator(registry);
    return aggregator.generateReport();
  }
}
