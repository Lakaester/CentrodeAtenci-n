import { useState } from "react";
import { Loader2, Shield, Flag, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTicketWorkspace } from "./useTicketWorkspace";
import { Cliente360 } from "./Cliente360";
import { WidgetSeccionRenderer, GuiaResolucionRenderer } from "./WidgetOperativoRenderer";
import { TimelineActividades } from "./TimelineActividades";

interface Props { ticketId: string | null }

type TabWS = "cliente360" | "diagnostico" | "herramientas" | "timeline" | "resultado";

const TABS: { key: TabWS; label: string; icon: React.ReactNode }[] = [
  { key: "cliente360", label: "Cliente 360°", icon: <FileText size={11} /> },
  { key: "diagnostico", label: "Diagnóstico", icon: <Shield size={11} /> },
  { key: "herramientas", label: "Herramientas", icon: <FileText size={11} /> },
  { key: "timeline", label: "Timeline", icon: <Clock size={11} /> },
  { key: "resultado", label: "Resultado", icon: <Flag size={11} /> },
];

function EncabezadoTicket({ workspace }: { workspace: import("./useTicketWorkspace").WorkspaceResponse }) {
  const org = workspace.origen;
  const contacto = workspace.contacto;
  const ticket = workspace.ticket as Record<string, unknown>;
  const statusLabel = ticket.status === "PENDIENTE" ? "Pendiente" : ticket.status === "EN_PROCESO" ? "En proceso" : "Cerrado";
  const slaVencido = ticket.slaVencido as boolean;
  const slaPct = ticket.slaPorcentaje as number;
  const tiempo = ticket.createdAt ? Math.floor((Date.now() - new Date(ticket.createdAt as string).getTime()) / 60000) : 0;

  return (
    <div className="shrink-0 border-b border-black-10 bg-white px-3 py-2">
      {/* Canal + Ticket ID + Estado */}
      {org && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-black-45">
          <span className="rounded bg-black-5 px-1.5 py-0.5 font-medium text-black-85">
            {org.canal === "zendesk" ? "Zendesk" : org.canal === "wameta" ? "Meta" : "Whaticket"}
          </span>
          <span>#{org.ticketOriginalId}</span>
          <span className={cn(
            "rounded px-1.5 py-0.5 capitalize",
            org.ticketOriginalStatus === "pending" ? "bg-warning-5 text-warning-65" :
            org.ticketOriginalStatus === "open" ? "bg-success-5 text-success" :
            "bg-black-5 text-black-65",
          )}>
            {org.ticketOriginalStatus}
          </span>
        </div>
      )}

      {/* Cliente + Dominio */}
      <div className="mb-1">
        <p className="truncate text-sm font-semibold text-black-85">{contacto.nombre}</p>
        <p className="truncate text-[10px] text-black-45">{contacto.dominio}</p>
      </div>

      {/* Tipo Cliente + Producto + País */}
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-black-45">
        {contacto.tipoCliente && (
          <span className={cn(
            "rounded px-1 py-0.5 text-[9px] font-medium",
            contacto.tipoCliente === "high_touch" ? "bg-purple-5 text-purple" :
            contacto.tipoCliente === "tech_touch" ? "bg-aqua-5 text-aqua" :
            "bg-black-5 text-black-65",
          )}>
            {contacto.tipoCliente === "high_touch" ? "High Touch" : contacto.tipoCliente === "tech_touch" ? "Tech Touch" : "Low Touch"}
          </span>
        )}
        {contacto.producto && <span>{contacto.producto}</span>}
        <span>{contacto.pais}</span>
      </div>

      {/* Tiempo + SLA */}
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-black-25">⏱ {tiempo >= 60 ? `${Math.floor(tiempo / 60)}h ${tiempo % 60}m` : `${tiempo} min`}</span>
        <span className={cn(
          "rounded px-1.5 py-0.5 font-semibold",
          slaVencido ? "bg-danger-5 text-danger" : slaPct >= 70 ? "bg-warning-5 text-warning-65" : "bg-success-5 text-success",
        )}>
          SLA {slaVencido ? "Vencido" : slaPct >= 70 ? "Próximo" : "OK"}
        </span>
        <span className="ml-auto text-[10px] text-black-45">{statusLabel}</span>
      </div>
    </div>
  );
}

export function WorkspaceCliente({ ticketId }: Props) {
  const [tab, setTab] = useState<TabWS>("cliente360");
  const { workspace, loading } = useTicketWorkspace(ticketId);

  if (!ticketId) return <AsideEmpty msg="Seleccione un ticket" />;
  if (loading) return <AsideEmpty msg={null} isLoading />;
  if (!workspace) return <AsideEmpty msg="No se pudo cargar" />;

  const ctx = workspace.contextoOperativo;
  const widgets = ctx?.widgets ?? [];

  return (
    <aside className="flex h-full w-full flex-col bg-light">
      {/* Encabezado */}
      <EncabezadoTicket workspace={workspace} />

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-black-10 bg-white">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[9px] font-medium transition-colors",
              tab === t.key ? "border-[#2563EB] text-primary" : "border-transparent text-black-45 hover:text-black-85")}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {tab === "cliente360" && <Cliente360 workspace={workspace} />}

        {tab === "diagnostico" && (
          <div className="space-y-3">
            <WidgetSeccionRenderer widgets={widgets} seccion="diagnostico" />
            <div className="border-t border-black-10 pt-3">
              <GuiaResolucionRenderer guia={ctx?.guia} />
            </div>
          </div>
        )}

        {tab === "herramientas" && (
          <div className="space-y-3">
            <WidgetSeccionRenderer widgets={widgets} seccion="herramientas" />
            {ctx?.herramientas && ctx.herramientas.length > 0 && (
              <div className="rounded-lg border border-black-10 bg-white p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black-45">Acceso rápido</p>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.herramientas.map((h, i) => (
                    <span key={i} className="rounded-md border border-black-10 bg-light px-2 py-1 text-[10px] text-black-45">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "timeline" && (
          <div className="rounded-lg border border-black-10 bg-white p-3">
            <TimelineActividades actividades={workspace.actividades ?? []} />
          </div>
        )}

        {tab === "resultado" && (
          <div className="space-y-3">
            <WidgetSeccionRenderer widgets={widgets} seccion="resultado" />
            {workspace.areaTrabajo && (
              <div className="rounded-lg border border-black-10 bg-white p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black-45">Estado final</p>
                <select className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs text-black-85 focus:border-[#2563EB] focus:outline-none">
                  <option value="">Seleccione...</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="parcial">Parcialmente resuelto</option>
                  <option value="escalado">Escalado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="sin_respuesta">Sin respuesta</option>
                  <option value="duplicado">Duplicado</option>
                </select>
              </div>
            )}
            {workspace.historial && workspace.historial.length > 0 && (
              <div className="rounded-lg border border-black-10 bg-white p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black-45">Actividades</p>
                <div className="space-y-1.5">
                  {workspace.historial.slice(-5).reverse().map((h, i) => (
                    <div key={h.id ?? i} className="flex items-start gap-2 rounded-md border border-black-5 p-2">
                      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium text-black-85">{h.canal}</p>
                        <p className="text-[9px] text-black-45">{h.categoria}{h.subcategoria ? ` · ${h.subcategoria}` : ""}{h.asesor ? ` · ${h.asesor}` : ""}</p>
                      </div>
                      <span className="shrink-0 text-[9px] text-black-25">
                        {h.fecha ? new Date(h.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function AsideEmpty({ msg, isLoading }: { msg: string | null; isLoading?: boolean }) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-black-10 bg-white">
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-black-25">
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : msg}
      </div>
    </aside>
  );
}
