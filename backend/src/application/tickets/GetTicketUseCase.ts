import type { ITicketRepository } from "../../contracts/tickets/ITicketRepository";
import { Ticket } from "../../domain/tickets/Ticket";

export class GetTicketUseCase {
  constructor(private repo: ITicketRepository) {}
  async execute(id: string): Promise<Ticket | null> {
    return this.repo.findById(id);
  }
}
