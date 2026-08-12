import type { InboxItemFE } from "@/components/zendesk/useZendeskInbox";
import type { InboxTicketDTO } from "../dto/inbox.dto";

export function zendeskToInbox(t: InboxItemFE): InboxTicketDTO {
  return {
    id: t.ticketId,
    ticketNumber: t.ticketId,
    channel: "email",
    subChannel: "zendesk",
    status: t.status,
    subject: t.subject,
    lastMessage: t.subject,
    contact: {
      name: t.requesterName,
      email: t.requesterEmail,
      phone: null,
      avatarUrl: null,
    },
    assignee: t.assigneeName ? { name: t.assigneeName, email: "" } : null,
    queue: null,
    updatedAt: t.updatedAt,
    createdAt: t.createdAt,
    unreadCount: 0,
    avatar: null,
    priority: t.priority ?? "normal",
    raw: t,
  };
}

export function zendeskToInboxMany(dtos: InboxItemFE[]): InboxTicketDTO[] {
  return dtos.map(zendeskToInbox);
}
