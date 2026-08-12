export type ActivityType =
  | "ticket-created"
  | "ticket-closed"
  | "ticket-reopened"
  | "note-added"
  | "mention"
  | "assignment"
  | "deployment"
  | "feature-flag"
  | "version-update"
  | "queue-alert";

export type ActivityPriority = "alta" | "media" | "baja";

export type ActivityStatus = "pendiente" | "completada" | "cancelada";

export interface ActivityDTO {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  timestamp: string;
  priority: ActivityPriority;
  status: ActivityStatus;
  iconKey: string;
  metadata?: Record<string, string>;
}
