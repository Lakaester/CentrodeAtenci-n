import type { TicketActionsProvider } from "../providers/TicketActionsProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { TicketActionRequestDTO, TicketActionResponseDTO } from "../dto/ticketActions.dto";

export class TicketActionsService {
  constructor(private provider: TicketActionsProvider) {}

  async executeAction(ticket: InboxTicketDTO, request: TicketActionRequestDTO): Promise<TicketActionResponseDTO> {
    return this.provider.executeAction(ticket, request);
  }
}
