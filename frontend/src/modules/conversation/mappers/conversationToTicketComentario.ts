import type { TicketComentario } from "@/hooks/useTicketDetail";
import type { ConversationMessageDTO } from "../dto/conversation.dto";

const TIPO_MAP: Record<string, "cliente" | "bot" | "agente" | "nota_interna" | "sistema"> = {
  customer: "cliente",
  agent: "agente",
  bot: "bot",
  system: "sistema",
  note_internal: "nota_interna",
};

export function conversationToTicketComentario(m: ConversationMessageDTO): TicketComentario {
  return {
    id: m.id,
    contenido: m.body,
    html: null,
    emisor: m.sender,
    tipo: TIPO_MAP[m.senderType] ?? "cliente",
    timestamp: m.createdAt,
    adjuntos: m.attachments.map((a) => ({
      id: a.id,
      nombre: a.name,
      url: a.url,
      content_type: a.contentType,
      size: a.size,
    })),
  };
}
