import type { ReplyRequestDTO } from "../dto/reply.dto";

export interface ZendeskReplyPayload {
  body: string;
  autor: string;
  resolver: boolean;
  archivos: { name: string; base64: string; contentType: string }[];
}

export function replyToZendesk(request: ReplyRequestDTO): ZendeskReplyPayload {
  return {
    body: request.message,
    autor: "COPE",
    resolver: false,
    archivos: request.attachments,
  };
}
