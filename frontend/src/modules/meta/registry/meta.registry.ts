import type { TicketStatus } from "../dto/meta.dto";

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; order: number }> = {
  open:    { label: "Open",    color: "text-success bg-success-5", order: 0 },
  pending: { label: "Pending", color: "text-warning bg-warning-5",     order: 1 },
  closed:  { label: "Closed",  color: "text-black-45 bg-black-5",   order: 2 },
  group:   { label: "Group",   color: "text-purple bg-purple-5",  order: 3 },
};
