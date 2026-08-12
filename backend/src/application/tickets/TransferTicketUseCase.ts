import type { ITicketRepository } from "../../contracts/tickets/ITicketRepository";
import { TicketLifecycle, type TicketLifecycleResult } from "../../domain/tickets/TicketLifecycle";

export class TransferTicketUseCase {
  constructor(private repo: ITicketRepository) {}
  async execute(id: string, nuevoAsesorId: string, nuevoAsesorNombre: string): Promise<TicketLifecycleResult> {
    const ticket = await this.repo.findById(id);
    if (!ticket) return { success: false, error: "Ticket no encontrado" };
    const result = TicketLifecycle.transfer(ticket, nuevoAsesorId, nuevoAsesorNombre);
    if (result.success && result.ticket) await this.repo.save(result.ticket);
    return result;
  }
}
