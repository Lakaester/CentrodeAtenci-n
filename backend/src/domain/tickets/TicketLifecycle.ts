import { Ticket } from "./Ticket";
import { canTransition } from "./TicketStatus";
import type { TicketStatus } from "./TicketStatus";

export type TicketLifecycleResult = LifecycleResult;

export interface LifecycleResult {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export class TicketLifecycle {
  static accept(ticket: Ticket, asesorId: string, asesorNombre: string): LifecycleResult {
    if (!canTransition(ticket.status, "EN_PROCESO")) {
      return { success: false, error: `No se puede aceptar un ticket en estado ${ticket.status}` };
    }
    ticket.status = "EN_PROCESO";
    ticket.asesorId = asesorId;
    ticket.asesorNombre = asesorNombre;
    ticket.updatedAt = new Date().toISOString();
    return { success: true, ticket };
  }

  static assign(ticket: Ticket, asesorId: string, asesorNombre: string): LifecycleResult {
    ticket.asesorId = asesorId;
    ticket.asesorNombre = asesorNombre;
    ticket.updatedAt = new Date().toISOString();
    return { success: true, ticket };
  }

  static transfer(ticket: Ticket, nuevoAsesorId: string, nuevoAsesorNombre: string): LifecycleResult {
    ticket.asesorId = nuevoAsesorId;
    ticket.asesorNombre = nuevoAsesorNombre;
    ticket.updatedAt = new Date().toISOString();
    return { success: true, ticket };
  }

  static resolve(ticket: Ticket): LifecycleResult {
    if (!canTransition(ticket.status, "RESUELTO")) {
      return { success: false, error: `No se puede resolver un ticket en estado ${ticket.status}` };
    }
    ticket.status = "RESUELTO";
    ticket.slaPorcentaje = 100;
    ticket.updatedAt = new Date().toISOString();
    return { success: true, ticket };
  }

  static close(ticket: Ticket): LifecycleResult {
    if (!canTransition(ticket.status, "CERRADO")) {
      return { success: false, error: `No se puede cerrar un ticket en estado ${ticket.status}` };
    }
    ticket.status = "CERRADO";
    ticket.slaPorcentaje = 100;
    ticket.updatedAt = new Date().toISOString();
    return { success: true, ticket };
  }

  static categorize(ticket: Ticket, categoria: string, subcategoria?: string): LifecycleResult {
    ticket.categoriaFinal = categoria;
    ticket.subcategoriaFinal = subcategoria;
    ticket.updatedAt = new Date().toISOString();
    return { success: true, ticket };
  }
}
