import { useMemo } from "react";
import { MessageCircle, MessageSquareMore, Mail, Clock } from "lucide-react";
import type { Ticket, CanalTicket } from "./types";
import { mejorTicket, NIVEL_CONFIG } from "./prioridad-engine";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props {
  tickets: Ticket[];
  activa: string;
  onSelect: (id: string) => void;
}

const CANAL_ICON: Record<CanalTicket, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  meta: MessageSquareMore,
  correo: Mail,
};

const CANAL_COLOR: Record<CanalTicket, string> = {
  whatsapp: "text-success",
  meta: "text-indigo-500",
  correo: "text-blue-500",
};

const SLA_ESTILO: Record<string, string> = {
  verde: "bg-success-5 text-success border-emerald-200",
  amarillo: "bg-warning-5 text-warning-65 border-amber-200",
  rojo: "bg-danger-5 text-danger border-rose-200",
};

const SLA_LABEL: Record<string, string> = {
  verde: "SLA OK",
  amarillo: "SLA por vencer",
  rojo: "SLA vencido",
};

const TC_LABEL: Record<string, string> = {
  high_touch: "High Touch",
  low_touch: "Low Touch",
  tech_touch: "Tech Touch",
};

const TC_ESTILO: Record<string, string> = {
  high_touch: "bg-purple-5 text-purple border-purple-200",
  low_touch: "bg-aqua-5 text-aqua border-sky-200",
  tech_touch: "bg-black-5 text-black-65 border-slate-200",
};

function BarrraProgreso({ valor, max }: { valor: number; max: number }) {
  const pct = Math.min(100, Math.round((valor / max) * 100));
  const color = pct >= 80 ? "bg-danger-50" : pct >= 50 ? "bg-amber-400" : pct >= 20 ? "bg-sky-400" : "bg-slate-300";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black-10">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TicketRecomendado({ tickets, activa, onSelect }: Props) {
  const recomendacion = useMemo(() => mejorTicket(tickets), [tickets]);

  if (!recomendacion) return null;

  const { ticket, score } = recomendacion;
  const nivelCfg = NIVEL_CONFIG[score.nivel];
  const Icon = CANAL_ICON[ticket.canal];
  const yaActivo = activa === ticket.id;

  return (
    <div className="border-b border-black-10 bg-white">
      <div className="px-3 pb-2 pt-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-black-85">
            Siguiente atención recomendada
          </h3>
        </div>

        <div className="rounded-lg border border-black-10 bg-light p-2.5">
          {/* Nivel */}
          <div className={cn("mb-2 inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-medium", nivelCfg.color)}>
            {nivelCfg.icono} {nivelCfg.label}
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[10px] font-semibold text-primary">
              {ticket.iniciales}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-black-85">{ticket.nombreCliente}</p>
              <p className="truncate text-[10px] text-black-45">{ticket.dominio}</p>
            </div>
          </div>

          {/* Canal + Categoría */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            <Icon size={12} className={CANAL_COLOR[ticket.canal]} />
            <span className="text-black-45">{ticket.canal === "whatsapp" ? "WhatsApp" : ticket.canal === "meta" ? "Meta" : "Correo"}</span>
            {ticket.categoria && (
              <>
                <span className="text-black-10">·</span>
                <span className="text-black-45">{ticket.categoria}</span>
              </>
            )}
          </div>

          {/* Tiempo esperando + Tipo Cliente + SLA */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-black-5 px-1.5 py-0.5 text-[10px] text-black-45">
              <Clock size={10} />
              {ticket.tiempoEsperando !== "—" ? ticket.tiempoEsperando : "0 min"}
            </span>
            <span className={cn("inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-medium", TC_ESTILO[ticket.tipoCliente])}>
              {TC_LABEL[ticket.tipoCliente]}
            </span>
            <span className={cn("inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-medium", SLA_ESTILO[ticket.sla])}>
              {SLA_LABEL[ticket.sla]}
            </span>
          </div>

          {/* Score */}
          <div className="mt-2 border-t border-black-10 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-black-45">Puntaje de prioridad</span>
              <span className={cn("text-base font-bold", score.puntos >= 80 ? "text-danger" : score.puntos >= 50 ? "text-warning" : "text-black-85")}>
                {score.puntos} pts
              </span>
            </div>
            <BarrraProgreso valor={score.puntos} max={score.maxPuntos} />
          </div>

          {/* Razones */}
          <div className="mt-1.5 space-y-0.5">
            {score.razones.map((r, i) => (
              <p key={i} className="text-[10px] text-black-45">
                • {r.texto} <span className="text-black-25">(+{r.puntos})</span>
              </p>
            ))}
          </div>

          {/* Botón */}
          <Button
            size="sm"
            variant="primary"
            className="mt-2.5 w-full text-[11px] h-8"
            onClick={() => onSelect(ticket.id)}
          >
            {yaActivo ? "En curso" : "Atender ahora"}
          </Button>
        </div>
      </div>
    </div>
  );
}
