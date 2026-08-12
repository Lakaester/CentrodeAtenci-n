import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ReplyRequestDTO, ReplyResponseDTO } from "../dto/reply.dto";

export interface ReplyProvider {
  sendReply(ticket: InboxTicketDTO, request: ReplyRequestDTO): Promise<ReplyResponseDTO>;
}
