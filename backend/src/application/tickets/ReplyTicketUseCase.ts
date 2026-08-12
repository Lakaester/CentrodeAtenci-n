import type { ITicketRepository } from "../../contracts/tickets/ITicketRepository";
import { Ticket } from "../../domain/tickets/Ticket";

export class ReplyTicketUseCase {
  constructor(private repo: ITicketRepository) {}
  async execute(id: string, mensaje: string, emisor: string): Promise<Ticket | null> {
    const ticket = await this.repo.findById(id);
    if (!ticket) return null;
    ticket.noLeido = 0;
    ticket.updatedAt = new Date().toISOString();
    return this.repo.save(ticket);
  }
}
