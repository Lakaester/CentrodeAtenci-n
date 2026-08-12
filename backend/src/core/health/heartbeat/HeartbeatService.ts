import type { Heartbeat, HealthStatus } from "../types";

export class HeartbeatService {
  private heartbeats = new Map<string, Heartbeat>();
  private startTime = Date.now();

  beat(component: string, status: HealthStatus = "healthy", version = "1.0"): Heartbeat {
    const hb: Heartbeat = { component, status, timestamp: new Date().toISOString(), version, uptimeMs: Date.now() - this.startTime };
    this.heartbeats.set(component, hb);
    return hb;
  }

  get(component: string): Heartbeat | undefined {
    return this.heartbeats.get(component);
  }

  list(): Heartbeat[] {
    return Array.from(this.heartbeats.values());
  }

  isAlive(component: string, maxAgeMs = 30000): boolean {
    const hb = this.heartbeats.get(component);
    if (!hb) return false;
    return Date.now() - new Date(hb.timestamp).getTime() < maxAgeMs;
  }
}
