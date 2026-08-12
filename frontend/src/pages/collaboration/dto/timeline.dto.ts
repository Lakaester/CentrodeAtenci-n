export type TimelineEventType =
  | "ticket-created" | "ticket-closed" | "ticket-reopened"
  | "note-added" | "mention" | "assignment"
  | "deployment" | "feature-flag" | "version-update" | "queue-alert"
  | "follower-added" | "follower-removed"
  | "status-change" | "internal-comment";

export type TimelinePriority = "alta" | "media" | "baja";
export type TimelineSource = "activity" | "notes" | "mentions" | "followers" | "system";

export interface TimelineDTO {
  id: string;
  entityId: string;
  entityType: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  createdAt: string;
  priority: TimelinePriority;
  status: string;
  source: TimelineSource;
  iconKey: string;
}
