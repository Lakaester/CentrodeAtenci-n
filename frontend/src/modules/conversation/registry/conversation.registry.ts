import type { SenderType } from "../dto/conversation.dto";

export const SENDER_TYPE_CONFIG: Record<SenderType, string> = {
  customer: "cliente",
  agent: "agente",
  bot: "bot",
  system: "sistema",
  note_internal: "nota_interna",
};
