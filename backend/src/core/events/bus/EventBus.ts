import { randomUUID } from "crypto";
import type { EventEnvelope, EventSubscription, EventSeverity } from "../types";

/**
 * EventBus — Sistema de eventos asincrónico y desacoplado.
 * No utiliza librerías externas. No bloquea la UI.
 */
export class EventBus {
  private subscriptions = new Map<string, EventSubscription[]>();
  private history: EventEnvelope[] = [];

  /**
   * Publica un evento. Todos los suscriptores del mismo tipo son notificados.
   */
  async publish(event: Omit<EventEnvelope, "eventId" | "timestamp">): Promise<void> {
    const envelope: EventEnvelope = {
      ...event,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.history.push(envelope);

    const subs = this.subscriptions.get(event.eventType) ?? [];
    await Promise.allSettled(
      subs
        .filter((s) => !s.filter || s.filter(envelope))
        .map((s) => s.handler(envelope).catch((err) => console.error(`[EventBus] Error en ${s.id}:`, err))),
    );
  }

  /** Suscribe un handler a un tipo de evento */
  subscribe(eventType: string, handler: (event: EventEnvelope) => Promise<void>, filter?: (event: EventEnvelope) => boolean): string {
    const id = randomUUID();
    const sub: EventSubscription = { id, eventType, handler, filter };
    const existing = this.subscriptions.get(eventType) ?? [];
    existing.push(sub);
    this.subscriptions.set(eventType, existing);
    return id;
  }

  /** Elimina una suscripción */
  unsubscribe(id: string): void {
    for (const [key, subs] of this.subscriptions) {
      this.subscriptions.set(key, subs.filter((s) => s.id !== id));
    }
  }

  /** Despacha un evento existente del historial */
  async dispatch(event: EventEnvelope): Promise<void> {
    await this.publish(event);
  }

  /** Verifica si un tipo de evento tiene suscriptores */
  exists(eventType: string): boolean {
    return (this.subscriptions.get(eventType)?.length ?? 0) > 0;
  }

  /** Lista suscriptores activos */
  list(): { eventType: string; count: number }[] {
    return Array.from(this.subscriptions.entries()).map(([k, v]) => ({ eventType: k, count: v.length }));
  }

  /** Obtiene el historial de eventos */
  getHistory(limit = 100): EventEnvelope[] {
    return this.history.slice(-limit);
  }
}
