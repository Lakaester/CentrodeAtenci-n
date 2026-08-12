import type { ReplyProvider } from "../providers/ReplyProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ReplyRequestDTO, ReplyResponseDTO } from "../dto/reply.dto";

export class ReplyService {
  constructor(private provider: ReplyProvider) {}

  async sendReply(ticket: InboxTicketDTO, request: ReplyRequestDTO): Promise<ReplyResponseDTO> {
    return this.provider.sendReply(ticket, request);
  }
}
