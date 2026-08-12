import type { ZendeskTicketFE } from "./useZendesk";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";

const ESTADO: Record<string, { label: string; dot: string }> = {
  new:    { label: "Nuevo",    dot: "bg-success-50" },
  open:   { label: "Abierto",  dot: "bg-primary-50" },
  pending:{ label: "Pendiente",dot: "bg-amber-400" },
  solved: { label: "Resuelto", dot: "bg-slate-400" },
  closed: { label: "Cerrado",  dot: "bg-slate-300" },
};

const PRIO_COR: Record<string, string> = {
  low: "text-black-45", normal: "text-primary", high: "text-warning", urgent: "text-danger",
};

function ND() { return <span className="text-black-10">—</span>; }

export function ConversationHeader({ ticket, tiempoAbierto }: { ticket: ZendeskTicketFE; tiempoAbierto: string }) {
  const e = ESTADO[ticket.ticketOriginalStatus] ?? { label: ticket.ticketOriginalStatus, dot: "bg-slate-400" };
  const p = PRIO_COR[ticket.prioridad ?? ""] ?? "";
  return (
    <div className="shrink-0 border-b border-black-10 bg-white">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-black-45 border-b border-black-5">
        <ChannelBadge canal="zendesk" size="sm" />
        <span className="text-black-10">·</span>
        <span className="font-mono font-medium text-black-85">#{ticket.ticketOriginalId}</span>
        <span className={cn("h-1.5 w-1.5 rounded-full", e.dot)} />
        <span className="font-medium text-black-85">{e.label}</span>
        {ticket.prioridad && <span className={cn("font-medium", p)}>{ticket.prioridad}</span>}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-black-25">
          <span>Abierto {tiempoAbierto}</span>
        </span>
      </div>
      <div className="px-3 py-1.5 text-[12px] font-medium text-black-85 leading-snug">
        {ticket.asunto}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 pb-1.5 text-[10px] text-black-45">
        <span><span className="text-black-25">Solicitante:</span> {ticket.clienteNombre}</span>
        {ticket.clienteEmail && <span><span className="text-black-25">Email:</span> {ticket.clienteEmail}</span>}
        {ticket.categoria && <span><span className="text-black-25">Categoría:</span> {ticket.categoria}</span>}
        <span className="ml-auto flex items-center gap-2">
          <span><span className="text-black-25">Creado:</span> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : <ND />}</span>
          <span><span className="text-black-25">Actualizado:</span> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : <ND />}</span>
        </span>
      </div>
    </div>
  );
}
