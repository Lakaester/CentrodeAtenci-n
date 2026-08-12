import type { InboxTicketDTO } from "../dto/inbox.dto";

export interface InboxProvider {
  getInbox(): Promise<InboxTicketDTO[]>;
}
