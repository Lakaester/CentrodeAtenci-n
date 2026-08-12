import { api } from "@/lib/api";
import type { ReplyProvider } from "./ReplyProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ReplyRequestDTO, ReplyResponseDTO } from "../dto/reply.dto";
import { MetaService } from "../../meta/services/MetaService";
import { metaProvider as metaProviderInstance } from "../../meta/providers";
import { replyToZendesk } from "../mappers";
import { ZENDESK_REPLY_ENDPOINT } from "../registry/reply.registry";

const metaService = new MetaService(metaProviderInstance);

export const mergedReplyProvider: ReplyProvider = {
  sendReply: async (ticket: InboxTicketDTO, request: ReplyRequestDTO): Promise<ReplyResponseDTO> => {
    if (request.subChannel === "meta") {
      const ticketId = Number(ticket.ticketNumber);
      await metaService.sendMessage(ticketId, request.message);
      return { success: true, messageId: `msg-${Date.now()}`, timestamp: new Date().toISOString(), raw: {} };
    }

    if (request.subChannel === "zendesk") {
      const payload = replyToZendesk(request);
      const { data } = await api.post(`${ZENDESK_REPLY_ENDPOINT}/${ticket.ticketNumber}/reply-resolve`, payload);
      return { success: true, messageId: `zd-${Date.now()}`, timestamp: new Date().toISOString(), raw: data };
    }

    throw new Error(`Canal no soportado: ${request.subChannel}`);
  },
};
