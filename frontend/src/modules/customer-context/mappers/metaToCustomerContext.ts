import type { MetaTicketDTO } from "../../meta/dto/meta.dto";
import type { CustomerContextDTO } from "../dto/customerContext.dto";

export function metaToCustomerContext(ticket: MetaTicketDTO): CustomerContextDTO {
  return {
    ticketId: String(ticket.id),
    channel: "whatsapp",
    subChannel: "meta",
    contact: { name: ticket.contact.name, email: ticket.contact.email, phone: ticket.contact.number, avatarUrl: ticket.contact.profilePicUrl },
    domain: null,
    assignedQueue: ticket.queue?.name ?? null,
    assignedUser: ticket.user?.name ?? null,
    conversationWindow: ticket.conversationWindow ? { expiresAt: ticket.conversationWindow.expiresAt, isExpired: ticket.conversationWindow.isExpired } : null,
    lastInteraction: ticket.updatedAt,
    health: null, healthScore: null, products: [], licenses: [], recentTickets: [], activities: [], diagnostics: [],
    versions: null, featureFlags: null, folios: null, queues: null, microservices: null,
    raw: ticket,
  };
}
