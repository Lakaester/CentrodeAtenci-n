import type { Ticket, TicketData } from "../../domain/tickets/Ticket";

export interface TicketFilters {
  status?: string;
  channel?: string;
  asesorId?: string;
  clienteId?: string;
  categoria?: string;
  search?: string;
  priority?: string;
  slaVencido?: boolean;
  page?: number;
  limit?: number;
}

export interface ITicketRepository {
  findById(id: string): Promise<Ticket | null>;
  findAll(filters?: TicketFilters): Promise<{ tickets: Ticket[]; total: number }>;
  save(ticket: Ticket): Promise<Ticket>;
  delete(id: string): Promise<boolean>;
}
