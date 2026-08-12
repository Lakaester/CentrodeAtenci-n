import { Clock, User } from "lucide-react";
import type { Ticket, CanalTicket } from "./types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { ESTADO_LABELS, TIPO_CLIENTE_LABELS } from "./types";

interface Props {
  ticket: Ticket;
  onClick: () => void;
}

const CANAL_LABEL: Record<CanalTicket, string> = {
  whatsapp: "WhatsApp",
  meta: "Meta",
  correo: "Zendesk",
};

const CANAL_BADGE: Record<CanalTicket, "whatsapp" | "meta" | "zendesk"> = {
  whatsapp: "whatsapp",
  meta: "meta",
  correo: "zendesk",
};

const SLA_BORDER: Record<string, string> = {
  verde: "border-l-emerald-500",
  amarillo: "border-l-amber-400",
  rojo: "border-l-rose-500",
};

const SLA_BG: Record<string, string> = {
  verde: "bg-success-5 text-success border-emerald-200",
  amarillo: "bg-warning-5 text-warning-65 border-amber-200",
  rojo: "bg-danger-5 text-danger border-rose-200",
};

const ESTADO_BG: Record<string, string> = {
  sin_atender: "bg-black-10 text-black-65",
  en_proceso: "bg-primary-5 text-primary",
  pendiente_cliente: "bg-warning-5 text-warning-65",
  esperando_desarrollo: "bg-purple-5 text-purple",
  esperando_gestion: "bg-aqua-5 text-aqua",
  resuelto: "bg-success-5 text-success",
};

const PRIO_INDICATOR: Record<string, string> = {
  critico: "bg-danger-50",
  alto: "bg-amber-400",
  medio: "bg-sky-400",
  bajo: "bg-slate-300",
};

function nivelPrioridad(t: Ticket): string {
  if (t.sla === "rojo" || t.tipoCliente === "high_touch") return "critico";
  if (t.sla === "amarillo") return "alto";
  if (t.prioridad <= 5) return "medio";
  return "bajo";
}

export function TicketCard({ ticket, onClick }: Props) {
  const nivel = nivelPrioridad(ticket);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border border-black-10 border-l-[4px] bg-white p-4 text-left  transition-all",
        SLA_BORDER[ticket.sla],
      )}
    >
      {/* Row 1: Avatar + Name + Domain + Canal + Country + Time */}
      <div className="flex items-center gap-3">
        <div className={cn("h-2 w-2 shrink-0 rounded-full", PRIO_INDICATOR[nivel])} />
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-10 text-xs font-semibold text-primary">
          {ticket.iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-black-85">{ticket.nombreCliente}</span>
            {ticket.noLeido > 0 && (
              <span className="flex h-4 min-w-[14px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                {ticket.noLeido}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-black-45">{ticket.dominio}</p>
        </div>
        <Badge variant={CANAL_BADGE[ticket.canal]} className="text-[10px] px-2 py-0.5">
          {CANAL_LABEL[ticket.canal]}
        </Badge>
        <span className="shrink-0 text-xs text-black-25">{ticket.pais}</span>
        <span className="flex shrink-0 items-center gap-1 text-xs text-black-25">
          <Clock size={12} />
          {ticket.tiempoEsperando !== "—" ? ticket.tiempoEsperando : "0 min"}
        </span>
      </div>

      {/* Row 2: Category + SLA + Status + Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {ticket.categoria && (
          <span className="rounded-md bg-black-5 px-2 py-0.5 text-[11px] text-black-45">
            {ticket.categoria}
          </span>
        )}
        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", SLA_BG[ticket.sla])}>
          SLA {ticket.sla === "verde" ? "OK" : ticket.sla === "amarillo" ? "Próximo" : "Vencido"}
        </span>
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", ESTADO_BG[ticket.estado])}>
          {ESTADO_LABELS[ticket.estado]}
        </span>
        <span className={cn(
          "rounded-md border px-2 py-0.5 text-[9px] font-medium uppercase",
          ticket.tipoCliente === "high_touch" && "border-purple-200 bg-purple-5 text-purple",
          ticket.tipoCliente === "low_touch" && "border-sky-200 bg-aqua-5 text-aqua",
          ticket.tipoCliente === "tech_touch" && "border-slate-200 bg-black-5 text-black-65",
        )}>
          {TIPO_CLIENTE_LABELS[ticket.tipoCliente]}
        </span>
        {ticket.estado === "esperando_desarrollo" && (
          <span className="rounded-md border border-purple-200 bg-purple-5 px-2 py-0.5 text-[10px] font-medium text-purple">
            🛠 Esperando DEV
          </span>
        )}
        {ticket.estado === "pendiente_cliente" && (
          <span className="rounded-md border border-amber-200 bg-warning-5 px-2 py-0.5 text-[10px] font-medium text-warning-65">
            ⏳ Esperando cliente
          </span>
        )}
        {!ticket.categoria && (
          <span className="rounded-md border border-rose-200 bg-danger-5 px-2 py-0.5 text-[10px] font-medium text-danger">
            ⚠ Sin categorizar
          </span>
        )}
      </div>

      {/* Row 3: Last message + time + asignado */}
      <div className="flex items-center justify-between text-xs">
        <p className="truncate text-black-25">{ticket.ultimoMensaje}</p>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] text-black-25">{ticket.timestamp}</span>
          {ticket.agenteAsignado && ticket.agenteAsignado !== "—" && (
            <span className="flex items-center gap-1 text-[10px] text-black-45">
              <User size={10} />
              {ticket.agenteAsignado}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
