import { Badge } from "@/components/ui/Badge";
import type { TicketDetail } from "@/hooks/useTicketDetail";

const ESTADO_BADGE: Record<string, { label: string; variant: "success" | "default" | "warning" | "primary" }> = {
  new:    { label: "Nuevo",    variant: "success" },
  open:   { label: "Abierto",  variant: "success" },
  pending:{ label: "Pendiente",variant: "warning" },
  solved: { label: "Resuelto", variant: "default" },
  closed: { label: "Cerrado",  variant: "default" },
};

const PRIORIDAD_BADGE: Record<string, { label: string; variant: "default" | "warning" | "danger" | "yellow" | "primary" | "success" }> = {
  low:    { label: "Baja",   variant: "default" },
  normal: { label: "Normal", variant: "primary" },
  high:   { label: "Alta",   variant: "warning" },
  urgent: { label: "Urgente",variant: "danger" },
};

interface Props {
  ticket: TicketDetail;
}

export function ConversationHeader({ ticket }: Props) {
  const e = ESTADO_BADGE[ticket.ticketOriginalStatus] ?? { label: ticket.ticketOriginalStatus, variant: "default" as const };
  const p = PRIORIDAD_BADGE[ticket.prioridad] ?? { label: ticket.prioridad, variant: "default" as const };

  return (
    <div className="shrink-0 border-b border-black-10 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={e.variant}>{e.label}</Badge>
        <Badge variant={p.variant}>{p.label}</Badge>
        <Badge variant="correo">Correo</Badge>
        <span className="ml-auto font-mono text-[11px] text-black-45">
          #{ticket.ticketOriginalId}
        </span>
      </div>

      <h2 className="mt-2 text-sm font-semibold text-black-85 leading-snug">
        {ticket.asunto}
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-black-45">
        <span>
          <span className="text-black-25">Cliente:</span>{" "}
          <span className="font-medium text-black-85">{ticket.clienteNombre}</span>
        </span>
        {ticket.clienteEmail && (
          <span>
            <span className="text-black-25">Email:</span>{" "}
            {ticket.clienteEmail}
          </span>
        )}
        <span>
          <span className="text-black-25">Fecha de creación:</span>{" "}
          {new Date(ticket.createdAt).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span>
          <span className="text-black-25">Última actualización:</span>{" "}
          {new Date(ticket.updatedAt).toLocaleDateString("es-PE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
