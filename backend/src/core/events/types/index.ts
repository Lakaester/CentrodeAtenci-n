export type EventSeverity = "info" | "warning" | "error";

export interface EventEnvelope {
  eventId: string;
  eventType: string;
  version: string;
  timestamp: string;
  requestId: string;
  correlationId: string;
  workspaceId?: string;
  customerId?: string;
  userId?: string;
  provider?: string;
  orchestrator?: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  source: string;
  origin: string;
  severity: EventSeverity;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: (event: EventEnvelope) => Promise<void>;
  filter?: (event: EventEnvelope) => boolean;
}

export const EVENT_TYPES = [
  "WorkspaceOpened", "WorkspaceClosed", "CustomerFound", "CustomerNotFound",
  "EnvironmentRequested", "LogsRequested", "FeatureFlagsRequested", "VersionsRequested",
  "DecisionGenerated", "RuleMatched", "RuleNotMatched",
  "AuditCreated", "TimelineCreated", "NotificationCreated",
  "ProviderConnected", "ProviderDisconnected", "ProviderError", "ConfigurationChanged",
] as const;

export type EventType = typeof EVENT_TYPES[number];
