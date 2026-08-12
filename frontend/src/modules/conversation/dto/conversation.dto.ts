import type { InboxChannel, InboxSubChannel } from "../../inbox/dto/inbox.dto";

export type SenderType = "customer" | "agent" | "bot" | "system" | "note_internal";

export interface ConversationAttachmentDTO {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export interface ConversationQuotedMessageDTO {
  id: string;
  body: string;
  sender: string;
}

export interface ConversationMessageDTO {
  id: string;
  ticketId: string;
  channel: InboxChannel;
  subChannel: InboxSubChannel;
  sender: string;
  senderType: SenderType;
  body: string;
  attachments: ConversationAttachmentDTO[];
  quotedMessage: ConversationQuotedMessageDTO | null;
  createdAt: string;
  read: boolean;
  raw: unknown;
}

export interface ConversationResponseDTO {
  messages: ConversationMessageDTO[];
  hasMore: boolean;
}
