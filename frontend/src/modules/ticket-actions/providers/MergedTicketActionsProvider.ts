import { api } from "@/lib/api";
import type { TicketActionsProvider } from "./TicketActionsProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { TicketActionRequestDTO, TicketActionResponseDTO } from "../dto/ticketActions.dto";
import { metaTicketActionMapper, zendeskTicketActionMapper } from "../mappers";

export const mergedTicketActionsProvider: TicketActionsProvider = {
  executeAction: async (ticket: InboxTicketDTO, request: TicketActionRequestDTO): Promise<TicketActionResponseDTO> => {
    if (request.subChannel === "meta") {
      const payload = metaTicketActionMapper(request);
      const ticketId = Number(ticket.ticketNumber);
      const { data } = await api.put(`/api/tickets/${ticketId}`, payload);
      return { success: true, updatedTicket: data ?? null, message: `Ticket ${request.action.toLowerCase()}`, timestamp: new Date().toISOString(), raw: data };
    }

    if (request.subChannel === "zendesk") {
      return zendeskTicketActionMapper(request);
    }

    throw new Error(`Canal no soportado: ${request.subChannel}`);
  },
};
