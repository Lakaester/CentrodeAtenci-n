import type { ITicketRepository, TicketFilters } from "../contracts/tickets/ITicketRepository";
import { Ticket, type TicketData } from "../domain/tickets/Ticket";

export class InMemoryTicketRepository implements ITicketRepository {
  private tickets: Map<string, Ticket> = new Map();

  async findById(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) ?? null;
  }

  async findAll(filters?: TicketFilters): Promise<{ tickets: Ticket[]; total: number }> {
    let resultados = Array.from(this.tickets.values());

    if (filters?.status) resultados = resultados.filter((t) => t.status === filters.status);
    if (filters?.channel) resultados = resultados.filter((t) => t.channel === filters.channel);
    if (filters?.asesorId) resultados = resultados.filter((t) => t.asesorId === filters.asesorId);
    if (filters?.clienteId) resultados = resultados.filter((t) => t.clienteId === filters.clienteId);
    if (filters?.priority) resultados = resultados.filter((t) => t.priority === filters.priority);
    if (filters?.slaVencido) resultados = resultados.filter((t) => t.slaVencido);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      resultados = resultados.filter((t) =>
        t.clienteNombre.toLowerCase().includes(q) || t.clienteDominio.toLowerCase().includes(q) || t.asunto.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
      );
    }

    resultados.sort((a, b) => b.priorityScore - a.priorityScore);
    const total = resultados.length;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const start = (page - 1) * limit;
    resultados = resultados.slice(start, start + limit);

    return { tickets: resultados, total };
  }

  async save(ticket: Ticket): Promise<Ticket> {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async delete(id: string): Promise<boolean> {
    return this.tickets.delete(id);
  }

  seed(data: TicketData[]): void {
    for (const d of data) {
      const ticket = new Ticket(d);
      this.tickets.set(ticket.id, ticket);
    }
  }
}
