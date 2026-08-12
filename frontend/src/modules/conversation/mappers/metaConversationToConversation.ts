import type { MetaConversationResponseDTO, MetaMessageDTO } from "../../meta/dto/meta.dto";
import type { ConversationMessageDTO, ConversationResponseDTO } from "../dto/conversation.dto";

function mapMessage(m: MetaMessageDTO): ConversationMessageDTO {
  return {
    id: m.id,
    ticketId: String(m.ticketId),
    channel: "whatsapp",
    subChannel: "meta",
    sender: m.senderName,
    senderType: m.fromMe ? "agent" : "customer",
    body: m.body,
    attachments: m.attachments.map((a) => ({ id: a.id, name: a.name, url: a.url, contentType: a.contentType, size: a.size })),
    quotedMessage: null,
    createdAt: m.createdAt,
    read: m.read,
    raw: m,
  };
}

export function metaConversationToConversation(dto: MetaConversationResponseDTO): ConversationResponseDTO {
  return {
    messages: dto.messages.map(mapMessage),
    hasMore: dto.hasMore,
  };
}
