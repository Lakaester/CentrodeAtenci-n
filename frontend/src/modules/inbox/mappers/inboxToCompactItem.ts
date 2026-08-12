import type { InboxItemFE } from "@/components/zendesk/useZendeskInbox";
import type { InboxTicketDTO } from "../dto/inbox.dto";

const CANAL_MAP: Record<string, string> = {
  email: "correo",
  whatsapp: "whatsapp",
};

export function inboxToCompactItem(t: InboxTicketDTO): InboxItemFE & { canal: string } {
  return {
    ticketId: t.ticketNumber,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    requesterName: t.contact.name,
    requesterEmail: t.contact.email,
    assigneeName: t.assignee?.name ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    tags: [],
    url: "",
    canal: CANAL_MAP[t.channel] ?? t.subChannel,
  };
}
