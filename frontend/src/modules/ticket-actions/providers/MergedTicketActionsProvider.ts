import type { TicketActionsProvider } from "./TicketActionsProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { TicketActionRequestDTO, TicketActionResponseDTO } from "../dto/ticketActions.dto";
import { zendeskTicketActionMapper } from "../mappers";

export const mergedTicketActionsProvider: TicketActionsProvider = {
  executeAction: async (_ticket: InboxTicketDTO, request: TicketActionRequestDTO): Promise<TicketActionResponseDTO> => {
    if (request.subChannel === "meta") {
      // Canal Meta no implementado (ghost/mock). Pendiente DECISIÓN-004.
      // No se invoca ningún endpoint: el PUT /tickets/:id no existe y el canal no tiene backend.
      throw new Error("Canal Meta no implementado (ghost). Pendiente DECISIÓN-004.");
    }

    if (request.subChannel === "zendesk") {
      return zendeskTicketActionMapper(request);
    }

    throw new Error(`Canal no soportado: ${request.subChannel}`);
  },
};
