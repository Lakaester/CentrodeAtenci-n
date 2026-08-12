import type { ITicketRepository, TicketFilters } from "../../contracts/tickets/ITicketRepository";
import { Ticket } from "../../domain/tickets/Ticket";

export class ListTicketsUseCase {
  constructor(private repo: ITicketRepository) {}
  async execute(filters?: TicketFilters): Promise<{ tickets: Ticket[]; total: number }> {
    return this.repo.findAll(filters);
  }
}
