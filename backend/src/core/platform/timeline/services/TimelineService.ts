import type { ITimelineService } from "../interfaces/ITimelineService";
import type { TimelineEvent } from "../types";

export class TimelineService implements ITimelineService {
  private events: TimelineEvent[] = [];

  async add(event: Omit<TimelineEvent, "id" | "timestamp">): Promise<void> {
    const entry: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.events.push(entry);
    console.log(`[Timeline] ${event.dominio} → ${event.provider}: ${event.event}`);
  }

  async findByDomain(dominio: string, limit = 50): Promise<TimelineEvent[]> {
    return this.events
      .filter((e) => e.dominio === dominio)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }
}
