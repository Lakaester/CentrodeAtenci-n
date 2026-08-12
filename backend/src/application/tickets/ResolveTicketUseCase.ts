import type { ITicketRepository } from "../../contracts/tickets/ITicketRepository";
import { TicketLifecycle, type TicketLifecycleResult } from "../../domain/tickets/TicketLifecycle";

export class ResolveTicketUseCase {
  constructor(private repo: ITicketRepository) {}
  async execute(id: string): Promise<TicketLifecycleResult> {
    const ticket = await this.repo.findById(id);
    if (!ticket) return { success: false, error: "Ticket no encontrado" };
    const result = TicketLifecycle.resolve(ticket);
    if (result.success && result.ticket) await this.repo.save(result.ticket);
    return result;
  }
}
