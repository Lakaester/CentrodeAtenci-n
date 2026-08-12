import { useState } from "react";
import { Sparkles, PanelRightClose, Target, CheckCircle2, Circle } from "lucide-react";
import { InputChat } from "./InputChat";
import { CopilotoPanel } from "./copiloto/CopilotoPanel";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TicketDTO } from "./useTickets";
import type { WorkspaceResponse } from "./useTicketWorkspace";

interface Props {
  ticket: TicketDTO;
  workspace: WorkspaceResponse | null;
}

const FLUJO_PASOS = ["identificacion", "diagnostico", "solucion", "validacion", "cierre"] as const;
const FLUJO_LABELS: Record<string, string> = { identificacion: "Identificación", diagnostico: "Diagnóstico", solucion: "Solución", validacion: "Validación", cierre: "Cierre" };

const CANAL_LABEL: Record<string, string> = {
  whaticket: "WhatsApp", meta: "Meta", zendesk: "Zendesk", correo: "Correo",
};

const CANAL_BADGE: Record<string, "whatsapp" | "meta" | "zendesk"> = {
  whaticket: "whatsapp", meta: "meta", zendesk: "zendesk", correo: "zendesk",
};

function formatTimestamp(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function Conversacion({ ticket, workspace }: Props) {
  const [copilotoOpen, setCopilotoOpen] = useState(false);
  const mensajes = workspace?.conversacion?.items ?? [];

  return (
    <div className="relative flex flex-1 overflow-hidden bg-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-black-10 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[10px] font-semibold text-primary">
              {(ticket.clienteNombre ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-black-85">{ticket.clienteNombre}</p>
              <p className="truncate text-[10px] text-black-45">{ticket.clienteDominio}</p>
              {workspace?.origen && (
                <p className="mt-0.5 text-[10px] text-black-45">
                  <span className="font-medium">{workspace.origen.canal === "zendesk" ? "Zendesk" : workspace.origen.canal === "wameta" ? "Meta" : "Whaticket"}</span>
                  <span className="mx-1">·</span>
                  <span>#{workspace.origen.ticketOriginalId}</span>
                  <span className="mx-1">·</span>
                  <span className="capitalize">{workspace.origen.ticketOriginalStatus}</span>
                </p>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={CANAL_BADGE[ticket.channel] ?? "zendesk"} className="text-[10px] px-2 py-0.5">
              {CANAL_LABEL[ticket.channel] ?? ticket.channel}
            </Badge>
            <span className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
              ticket.slaVencido ? "bg-danger-5 text-danger border-rose-200" : ticket.slaPorcentaje >= 70 ? "bg-warning-5 text-warning-65 border-amber-200" : "bg-success-5 text-success border-emerald-200",
            )}>
              SLA {ticket.slaVencido ? "Vencido" : ticket.slaPorcentaje >= 70 ? "Próximo" : "OK"}
            </span>
            <span className="text-[11px] text-black-45">{ticket.status === "PENDIENTE" ? "Pendiente" : ticket.status === "EN_PROCESO" ? "En proceso" : "Cerrado"}</span>
            <button
              onClick={() => setCopilotoOpen(!copilotoOpen)}
              className={cn("flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors", copilotoOpen ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}
            >
              <Sparkles size={13} /> Copiloto
            </button>
          </div>
        </div>

        {/* Case header */}
        <div className="shrink-0 space-y-2 border-b border-black-10 bg-light px-4 py-3">
          <div className="flex items-start gap-2 text-xs">
            <Target size={14} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-black-85">{ticket.asunto}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary-10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {ticket.status === "PENDIENTE" ? "Pendiente" : ticket.status === "EN_PROCESO" ? "En proceso" : "Cerrado"}
            </span>
            <div className="flex flex-1 items-center gap-1">
              {FLUJO_PASOS.map((paso, i) => {
                const completado = i < 1;
                const actual = i === 1;
                return (
                  <div key={paso} className="flex flex-1 items-center gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {completado ? <CheckCircle2 size={11} className="shrink-0 text-success" /> : actual ? <Circle size={11} className="shrink-0 fill-[#2563EB] text-primary" /> : <Circle size={11} className="shrink-0 text-black-10" />}
                      <span className={cn("truncate text-[10px]", completado ? "text-success font-medium" : actual ? "text-primary font-medium" : "text-black-25")}>
                        {FLUJO_LABELS[paso]}
                      </span>
                    </div>
                    {i < FLUJO_PASOS.length - 1 && <div className={cn("h-px flex-1", i < 1 ? "bg-emerald-400" : "bg-black-10")} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
          {mensajes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-xs text-black-25">
              No hay mensajes disponibles para este ticket
            </div>
          ) : (
            mensajes.map((msg) => (
              <div key={msg.id} className="flex justify-center">
                <div className="w-full rounded-lg border border-black-10 bg-light p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-black-85">{msg.emisor}</span>
                    <span className="text-[10px] text-black-25">
                      {formatDate(msg.timestamp)} {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-black-45">{msg.contenido}</p>
                </div>
              </div>
            ))
          )}

          {/* Eventos del sistema desde el workspace */}
          {workspace?.historial && workspace.historial.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-black-10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black-25">Historial del caso</p>
              {workspace.historial.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-start gap-3 rounded-lg border border-black-10 border-l-4 border-l-[#2563EB] bg-[#F0F7FF] p-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-black-85">{h.canal}</p>
                      <span className="text-[10px] text-black-25">{h.fecha ? new Date(h.fecha).toLocaleDateString("es-PE") : ""}</span>
                    </div>
                    <p className="mt-0.5 text-black-45">{h.categoria}{h.subcategoria ? ` · ${h.subcategoria}` : ""}{h.asesor ? ` · ${h.asesor}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <InputChat />
      </div>

      {copilotoOpen && (
        <div className="absolute right-0 top-0 z-20 flex h-full w-[320px] flex-col border-l border-black-10 bg-white ">
          <div className="flex items-center justify-between border-b border-black-10 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-black-85">
              <Sparkles size={14} className="text-primary" /> Copiloto COPE
            </span>
            <button onClick={() => setCopilotoOpen(false)} className="text-black-25 hover:text-black-85">
              <PanelRightClose size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CopilotoPanel />
          </div>
        </div>
      )}
    </div>
  );
}
