export interface TimelineEvent {
  id: string;
  timestamp: string;
  dominio: string;
  provider: string;
  event: string;
  detail: string;
  durationMs?: number;
}
