import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketActionsService } from "../services/TicketActionsService";
import { ticketActionsProvider } from "../providers";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { TicketActionRequestDTO, TicketActionResponseDTO } from "../dto/ticketActions.dto";

const service = new TicketActionsService(ticketActionsProvider);

interface UseTicketActionParams {
  ticket: InboxTicketDTO | null;
  onSuccess?: (response: TicketActionResponseDTO) => void;
  onError?: (error: string) => void;
}

export function useTicketAction({ ticket, onSuccess, onError }: UseTicketActionParams) {
  const queryClient = useQueryClient();

  return useMutation<TicketActionResponseDTO, Error, { action: TicketActionRequestDTO }>({
    mutationFn: async ({ action }) => {
      if (!ticket) throw new Error("No hay ticket seleccionado");
      return service.executeAction(ticket, action);
    },
    onSuccess: (response) => {
      if (ticket) {
        queryClient.invalidateQueries({ queryKey: ["inbox"] });
        queryClient.invalidateQueries({ queryKey: ["conversation", ticket.id, ticket.subChannel] });
        queryClient.invalidateQueries({ queryKey: ["customer-context", ticket.id, ticket.subChannel] });
      }
      onSuccess?.(response);
    },
    onError: (err) => {
      onError?.(err.message);
    },
  });
}
