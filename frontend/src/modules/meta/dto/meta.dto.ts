export type TicketStatus = "open" | "pending" | "closed" | "group";

export interface MetaContactDTO {
  id: number;
  name: string;
  number: string;
  email: string | null;
  profilePicUrl: string | null;
}

export interface MetaQueueDTO {
  id: number;
  name: string;
  color: string;
}

export interface MetaUserDTO {
  id: number;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

export interface MetaWhatsappDTO {
  id: number;
  name: string;
  number: string;
}

export interface MetaConversationWindowDTO {
  id: number;
  lastInteractionAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface MetaTicketDTO {
  id: number;
  status: TicketStatus;
  lastMessage: string;
  updatedAt: string;
  contact: MetaContactDTO;
  queue: MetaQueueDTO | null;
  user: MetaUserDTO | null;
  whatsapp: MetaWhatsappDTO;
  conversationWindow: MetaConversationWindowDTO | null;
}

export interface MetaTicketResponseDTO {
  tickets: MetaTicketDTO[];
  count: number;
  hasMore: boolean;
}

export interface MetaMessageAttachmentDTO {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export interface MetaMessageDTO {
  id: string;
  ticketId: number;
  body: string;
  fromMe: boolean;
  senderName: string;
  createdAt: string;
  messageType: "text" | "image" | "document" | "audio";
  attachments: MetaMessageAttachmentDTO[];
  quotedMsgId: string | null;
  read: boolean;
}

export interface MetaConversationResponseDTO {
  messages: MetaMessageDTO[];
  hasMore: boolean;
}
