import type { InboxItemFE } from "@/components/zendesk/useZendeskInbox";
import type { CustomerContextDTO } from "../dto/customerContext.dto";

export function zendeskToCustomerContext(ticket: InboxItemFE): CustomerContextDTO {
  return {
    ticketId: ticket.ticketId,
    channel: "email",
    subChannel: "zendesk",
    contact: { name: ticket.requesterName, email: ticket.requesterEmail, phone: null, avatarUrl: null },
    domain: null, assignedQueue: null, assignedUser: ticket.assigneeName ?? null,
    conversationWindow: null, lastInteraction: ticket.updatedAt,
    health: null, healthScore: null, products: [], licenses: [], recentTickets: [], activities: [], diagnostics: [],
    versions: null, featureFlags: null, folios: null, queues: null, microservices: null,
    raw: ticket,
  };
}
