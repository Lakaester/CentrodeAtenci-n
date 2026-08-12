export type MentionStatus = "pending" | "read" | "resolved";
export type MentionPriority = "alta" | "media" | "baja";

export interface MentionDTO {
  id: string;
  ticketId: string;
  mentionedUser: string;
  mentionedRole: string;
  mentionedBy: string;
  message: string;
  createdAt: string;
  status: MentionStatus;
  priority: MentionPriority;
  isRead: boolean;
}
