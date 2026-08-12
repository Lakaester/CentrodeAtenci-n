import type { MetaTicketDTO } from "../../meta/dto/meta.dto";
import type { InboxTicketDTO } from "../dto/inbox.dto";

export function metaToInbox(t: MetaTicketDTO): InboxTicketDTO {
  return {
    id: String(t.id),
    ticketNumber: String(t.id),
    channel: "whatsapp",
    subChannel: "meta",
    status: t.status === "open" ? "new" : t.status === "pending" ? "open" : t.status,
    subject: t.lastMessage,
    lastMessage: t.lastMessage,
    contact: {
      name: t.contact.name,
      email: t.contact.email,
      phone: t.contact.number,
      avatarUrl: t.contact.profilePicUrl,
    },
    assignee: t.user ? { name: t.user.name, email: t.user.email } : null,
    queue: t.queue ? { name: t.queue.name, color: t.queue.color } : null,
    updatedAt: t.updatedAt,
    createdAt: t.updatedAt,
    unreadCount: 0,
    avatar: null,
    priority: "normal",
    raw: t,
  };
}

export function metaToInboxMany(dtos: MetaTicketDTO[]): InboxTicketDTO[] {
  return dtos.map(metaToInbox);
}
