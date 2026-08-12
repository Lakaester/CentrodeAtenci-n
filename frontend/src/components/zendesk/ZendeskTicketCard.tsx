import { cn } from "@/lib/utils";
import type { InboxItemFE } from "./useZendeskInbox";

const ESTADO_LABEL: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  pending: "Pendiente",
  solved: "Resuelto",
  closed: "Cerrado",
};

const ESTADO_COLOR: Record<string, string> = {
  new: "bg-success-10 text-success border-green-200",
  open: "bg-primary-10 text-primary border-blue-200",
  pending: "bg-warning-10 text-warning-65 border-amber-200",
  solved: "bg-success-10 text-success border-emerald-200",
  closed: "bg-black-10 text-black-65 border-slate-200",
};

const PRIORIDAD: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",     color: "bg-black-5 text-black-65" },
  normal: { label: "Normal",   color: "bg-primary-5 text-primary" },
  high:   { label: "Alta",     color: "bg-orange-50 text-warning" },
  urgent: { label: "Urgente",  color: "bg-danger-5 text-danger" },
};

const CANAL_BADGE: Record<string, { label: string; color: string }> = {
  correo:   { label: "Correo",   color: "bg-purple-10 text-purple border-purple-200" },
  whatsapp: { label: "WhatsApp", color: "bg-success-10 text-success border-green-200" },
  meta:     { label: "Meta",     color: "bg-primary-10 text-primary border-blue-200" },
  whaticket:{ label: "Whaticket",color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  zendesk:  { label: "Correo",   color: "bg-purple-10 text-purple border-purple-200" },
};

interface Props {
  ticket: InboxItemFE & { canal?: string };
  activa: boolean;
  onClick: () => void;
}

export function ZendeskTicketCard({ ticket, activa, onClick }: Props) {
  const estadoLabel = ESTADO_LABEL[ticket.status] ?? ticket.status;
  const estadoColor = ESTADO_COLOR[ticket.status] ?? ESTADO_COLOR.pending;

  const fecha = new Date(ticket.createdAt);
  const fechaStr = fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const canal = CANAL_BADGE[ticket.canal ?? "zendesk"] ?? CANAL_BADGE.zendesk;
  const prio = PRIORIDAD[ticket.priority] ?? { label: ticket.priority, color: "bg-black-5 text-black-65" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left text-xs transition-all",
        activa
          ? "border-[#2563EB] bg-primary-5 "
          : "border-black-5 hover:border-black-10 hover:bg-light",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", estadoColor)}>
            {estadoLabel}
          </span>
          <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium", prio.color)}>
            {prio.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-black-45">
          #{ticket.ticketId}
        </span>
      </div>

      <p className="truncate text-sm font-semibold text-black-85">
        {ticket.subject || "Sin asunto"}
      </p>

      <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
        <span className="truncate font-medium">{ticket.requesterName}</span>
        {ticket.requesterEmail && (
          <>
            <span className="text-black-25">·</span>
            <span className="truncate text-black-45">{ticket.requesterEmail}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-black-45">
        <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium", canal.color)}>
          {canal.label}
        </span>
        <span>{fechaStr}</span>
        {ticket.assigneeName && (
          <>
            <span className="text-black-25">·</span>
            <span>{ticket.assigneeName}</span>
          </>
        )}
      </div>
    </button>
  );
}
