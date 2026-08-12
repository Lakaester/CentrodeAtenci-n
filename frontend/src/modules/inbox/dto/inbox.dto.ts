export type InboxChannel = "email" | "whatsapp" | "chat" | "instagram" | "facebook" | "bot" | "unknown";
export type InboxSubChannel = "zendesk" | "meta" | "whaticket" | "unknown";

export interface InboxContactDTO {
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface InboxAssigneeDTO {
  name: string;
  email: string;
}

export interface InboxQueueDTO {
  name: string;
  color: string;
}

export interface InboxTicketDTO {
  id: string;
  ticketNumber: string;
  channel: InboxChannel;
  subChannel: InboxSubChannel;
  status: string;
  subject: string;
  lastMessage: string;
  contact: InboxContactDTO;
  assignee: InboxAssigneeDTO | null;
  queue: InboxQueueDTO | null;
  updatedAt: string;
  createdAt: string;
  unreadCount: number;
  avatar: string | null;
  priority: string;
  raw: unknown;
}
