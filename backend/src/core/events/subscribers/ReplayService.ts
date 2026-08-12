import type { EventEnvelope } from "../types";

/**
 * ReplayService — Reconstrucción de sesiones a partir de eventos.
 * Pendiente de implementar persistencia.
 */
export class ReplayService {
  private sessionStore = new Map<string, EventEnvelope[]>();

  record(event: EventEnvelope): void {
    const key = event.correlationId;
    const existing = this.sessionStore.get(key) ?? [];
    existing.push(event);
    this.sessionStore.set(key, existing);
  }

  getSession(correlationId: string): EventEnvelope[] {
    return this.sessionStore.get(correlationId) ?? [];
  }

  listSessions(): { correlationId: string; count: number }[] {
    return Array.from(this.sessionStore.entries()).map(([k, v]) => ({ correlationId: k, count: v.length }));
  }

  async replay(correlationId: string): Promise<EventEnvelope[]> {
    return this.getSession(correlationId);
  }
}
