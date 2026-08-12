import type { ReplyRequestDTO } from "../dto/reply.dto";

export interface MetaSendMessagePayload {
  body: string;
  fromMe: boolean;
  read: number;
  mediaUrl: string;
  quotedMsg: string | null;
}

export function replyToMeta(request: ReplyRequestDTO): MetaSendMessagePayload {
  return {
    body: request.message,
    fromMe: true,
    read: 1,
    mediaUrl: "",
    quotedMsg: request.quotedMessage,
  };
}
