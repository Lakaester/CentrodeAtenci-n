export type TicketStatus = "PENDIENTE" | "EN_PROCESO" | "RESUELTO" | "CERRADO";

export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  PENDIENTE: ["EN_PROCESO", "CERRADO"],
  EN_PROCESO: ["RESUELTO", "PENDIENTE", "CERRADO"],
  RESUELTO: ["CERRADO", "EN_PROCESO"],
  CERRADO: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TICKET_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
