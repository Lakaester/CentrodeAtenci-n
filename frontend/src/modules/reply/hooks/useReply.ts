import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReplyService } from "../services/ReplyService";
import { replyProvider } from "../providers";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ReplyRequestDTO, ReplyResponseDTO } from "../dto/reply.dto";
import type { ConversationMessageDTO } from "../../conversation/dto/conversation.dto";

const service = new ReplyService(replyProvider);

interface UseReplyParams {
  ticket: InboxTicketDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface ReplyMutationVars {
  request: ReplyRequestDTO;
}

export function useReply({ ticket, onSuccess, onError }: UseReplyParams) {
  const queryClient = useQueryClient();

  return useMutation<ReplyResponseDTO, Error, ReplyMutationVars>({
    mutationFn: async ({ request }) => {
      if (!ticket) throw new Error("No hay ticket seleccionado");
      return service.sendReply(ticket, request);
    },
    onMutate: async ({ request }) => {
      if (!ticket) return;

      const queryKey = ["conversation", ticket.id, ticket.subChannel];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ messages: ConversationMessageDTO[] }>(queryKey);

      if (previous) {
        const optimisticMessage: ConversationMessageDTO = {
          id: `optimistic-${Date.now()}`,
          ticketId: ticket.id,
          channel: ticket.channel,
          subChannel: ticket.subChannel,
          sender: "Tú",
          senderType: "agent",
          body: request.message,
          attachments: [],
          quotedMessage: null,
          createdAt: new Date().toISOString(),
          read: true,
          raw: {},
        };

        queryClient.setQueryData(queryKey, {
          ...previous,
          messages: [...previous.messages, optimisticMessage],
        });
      }

      return { previous };
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous && ticket) {
        const queryKey = ["conversation", ticket.id, ticket.subChannel];
        queryClient.setQueryData(queryKey, context.previous);
      }
      onError?.(_err.message);
    },
    onSettled: (_data, _error, _vars) => {
      if (ticket) {
        const queryKey = ["conversation", ticket.id, ticket.subChannel];
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
