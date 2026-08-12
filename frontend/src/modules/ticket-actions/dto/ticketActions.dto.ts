import type { InboxChannel, InboxSubChannel } from "../../inbox/dto/inbox.dto";

export type TicketActionType =
  | "CLOSE"
  | "REOPEN"
  | "TRANSFER"
  | "CHANGE_QUEUE"
  | "CHANGE_ASSIGNEE"
  | "ADD_CATEGORY"
  | "REMOVE_CATEGORY"
  | "REQUEST_SUPPORT"
  | "MARK_PENDING"
  | "MARK_OPEN"
  | "CUSTOM";

export interface TicketActionRequestDTO {
  ticketId: string;
  channel: InboxChannel;
  subChannel: InboxSubChannel;
  action: TicketActionType;
  payload: Record<string, unknown>;
  raw: unknown;
}

export interface TicketActionResponseDTO {
  success: boolean;
  updatedTicket: Record<string, unknown> | null;
  message: string;
  timestamp: string;
  raw: unknown;
}
