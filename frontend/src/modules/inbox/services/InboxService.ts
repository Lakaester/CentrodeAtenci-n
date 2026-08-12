import type { InboxProvider } from "../providers/InboxProvider";
import type { InboxTicketDTO } from "../dto/inbox.dto";

export class InboxService {
  constructor(private provider: InboxProvider) {}

  async getInbox(): Promise<InboxTicketDTO[]> {
    return this.provider.getInbox();
  }
}
