export interface DevEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  provider?: string;
  correlationId: string;
  requestId: string;
  severity: string;
  payload?: any;
  metadata?: Record<string, unknown>;
}
