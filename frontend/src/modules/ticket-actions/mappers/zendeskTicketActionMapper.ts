import { api } from "@/lib/api";
import type { TicketActionRequestDTO, TicketActionResponseDTO } from "../dto/ticketActions.dto";

export async function zendeskTicketActionMapper(request: TicketActionRequestDTO): Promise<TicketActionResponseDTO> {
  const actionEndpoints: Record<string, string> = {
    CLOSE: `/zendesk/tickets/${request.ticketId}/status`,
    REOPEN: `/zendesk/tickets/${request.ticketId}/status`,
    MARK_PENDING: `/zendesk/tickets/${request.ticketId}/status`,
    MARK_OPEN: `/zendesk/tickets/${request.ticketId}/status`,
    CHANGE_ASSIGNEE: `/zendesk/tickets/${request.ticketId}/assign`,
    ADD_CATEGORY: `/zendesk/tickets/${request.ticketId}/categorize`,
  };

  const endpoint = actionEndpoints[request.action];
  if (!endpoint) throw new Error(`Acción no soportada para Zendesk: ${request.action}`);

  const { data } = await api.post(endpoint, request.payload);
  return {
    success: true,
    updatedTicket: data?.data ?? null,
    message: `Acción ${request.action} ejecutada`,
    timestamp: new Date().toISOString(),
    raw: data,
  };
}
