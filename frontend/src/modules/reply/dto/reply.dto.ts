import type { InboxChannel, InboxSubChannel } from "../../inbox/dto/inbox.dto";

export interface ReplyAttachmentDTO {
  name: string;
  base64: string;
  contentType: string;
}

export interface ReplyRequestDTO {
  ticketId: string;
  channel: InboxChannel;
  subChannel: InboxSubChannel;
  message: string;
  attachments: ReplyAttachmentDTO[];
  quotedMessage: string | null;
  raw: unknown;
}

export interface ReplyResponseDTO {
  success: boolean;
  messageId: string;
  timestamp: string;
  raw: unknown;
}
