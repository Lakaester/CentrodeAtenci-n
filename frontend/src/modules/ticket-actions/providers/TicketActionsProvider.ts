import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { TicketActionRequestDTO, TicketActionResponseDTO } from "../dto/ticketActions.dto";

export interface TicketActionsProvider {
  executeAction(ticket: InboxTicketDTO, action: TicketActionRequestDTO): Promise<TicketActionResponseDTO>;
}
