import type { TimelineEvent } from "../types";

export interface ITimelineService {
  add(event: Omit<TimelineEvent, "id" | "timestamp">): Promise<void>;
  findByDomain(dominio: string, limit?: number): Promise<TimelineEvent[]>;
}
