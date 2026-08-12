import { useState, useMemo, useEffect } from "react";
import { Loader2, Search, RefreshCw, AlertCircle, Wifi, WifiOff, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useZendeskInbox, type InboxItemFE } from "@/components/zendesk/useZendeskInbox";
import { useZendeskTicket } from "@/components/zendesk/useZendesk";
import { ChannelBadge } from "@/components/zendesk/ChannelBadge";
import { ConversationHeader } from "@/components/zendesk/ConversationHeader";
import { QuickSummary } from "@/components/zendesk/QuickSummary";
import { MessageTimeline } from "@/components/zendesk/MessageTimeline";
import { ContextActions } from "@/components/zendesk/ContextActions";
import { ModuloDiagnosticoOperativo } from "@/components/zendesk/ModuloDiagnosticoOperativo";
import { ModuloCliente360Real } from "@/components/zendesk/ModuloCliente360Real";
import { WorkspaceFactory } from "@/components/zendesk/WorkspaceFactory";

const ESTADO: Record<string, { label: string; dot: string }> = {
  new:    { label: "Nuevo",    dot: "bg-success-50" },
  open:   { label: "Abierto",  dot: "bg-primary-50" },
  pending:{ label: "Pendiente",dot: "bg-amber-400" },
  solved: { label: "Resuelto", dot: "bg-slate-400" },
  closed: { label: "Cerrado",  dot: "bg-slate-300" },
};

function ND() { return <span className="text-black-10">—</span>; }

function AtencionRow({ item, activa, onSelect }:
  { item: InboxItemFE; activa: boolean; onSelect: () => void }) {
  const e = ESTADO[item.status] ?? { label: item.status, dot: "bg-slate-400" };
  const inic = item.requesterName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <button onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2.5 border-b border-black-5 px-3 py-2.5 text-left transition-colors hover:bg-light group",
        activa && "bg-primary-5 hover:bg-primary-5",
      )}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black-10 text-[10px] font-semibold text-black-45">{inic}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-black-85">{item.requesterName}</span>
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", e.dot)} />
          <span className="shrink-0 text-[10px] text-black-45">{e.label}</span>
          <span className="ml-auto shrink-0 text-[10px] text-black-25">
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>
        <p className="truncate text-[11px] text-black-45">{item.subject}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-black-25">
          <ChannelBadge canal="zendesk" />
          <span>#{item.ticketId}</span>
          {item.estadoOperativo === "RECIENTE" && (
            <span className="rounded bg-aqua-5 px-1 py-0.5 text-[8px] font-medium text-aqua">RECIENTE</span>
          )}
          <span className="ml-auto truncate">{item.requesterEmail ?? "Sin email"}</span>
        </div>
      </div>
    </button>
  );
}

export default function ZendeskPage() {
  const [activa, setActiva] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const { data: inbox, isLoading, error, dataUpdatedAt, refetch } = useZendeskInbox();
  const tickets = inbox?.tickets ?? [];
  const vistaName = "Inbox";
  const [syncLabel, setSyncLabel] = useState("");

  useEffect(() => {
    if (!dataUpdatedAt) { setSyncLabel(""); return; }
    const actualizar = () => {
      const seg = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      setSyncLabel(seg < 60 ? `hace ${seg}s` : `hace ${Math.floor(seg / 60)}min`);
    };
    actualizar();
    const id = setInterval(actualizar, 10000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  const ticketActivo = tickets.find((t) => t.ticketId === activa) ?? null;
  const { ticket, conversacion, loading: loadingTicket } = useZendeskTicket(activa);

  const filtrados = useMemo(() => {
    if (!busqueda) return tickets;
    const q = busqueda.toLowerCase();
    return tickets.filter((t) =>
      t.requesterName.toLowerCase().includes(q) ||
      (t.requesterEmail ?? "").toLowerCase().includes(q) ||
      t.ticketId.includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  }, [tickets, busqueda]);

  const calcTiempoAbierto = (createdAt?: string): string => {
    if (!createdAt) return "—";
    const min = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (min < 1) return "< 1 min";
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex h-full bg-white">
      {/* ── BANDEJA (24%) ── */}
      <div className="flex w-[24%] min-w-[280px] shrink-0 flex-col border-r border-black-10 bg-white overflow-hidden">
        <div className="shrink-0 border-b border-black-10 px-3 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-black-85">Bandeja</h1>
            <button onClick={() => refetch()} className="text-black-25 hover:text-primary transition-colors" title="Recargar">
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[10px] text-black-25">{vistaName} · {inbox?.total ?? 0} tickets</p>
            {dataUpdatedAt > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-success">
                <Wifi size={8} /> {syncLabel}
              </span>
            )}
            {error && (
              <span className="flex items-center gap-0.5 text-[9px] text-danger">
                <WifiOff size={8} /> Sin conexión
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 border-b border-black-5 p-2">
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-25" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, email o ticket..."
              className="w-full rounded-md border border-black-10 bg-light py-1 pl-7 pr-2 text-[11px] text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 size={18} className="animate-spin text-black-25" /></div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <AlertCircle size={24} className="text-rose-300" />
              <p className="text-[11px] font-medium text-danger">No fue posible conectar con Zendesk</p>
              <p className="text-[10px] text-black-25">{error instanceof Error ? error.message : String(error)}</p>
              <button onClick={() => refetch()}
                className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[10px] font-medium text-white hover:bg-primary-85">
                <RefreshCw size={10} /> Reintentar
              </button>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
              <Inbox size={22} className="text-black-10" />
              <p className="text-[11px] text-black-25">No hay tickets en esta vista</p>
              <p className="text-[10px] text-black-10">Configura Zendesk en .env o prueba con otra vista.</p>
            </div>
          ) : (
            filtrados.map((item) => (
              <AtencionRow key={item.ticketId} item={item} activa={activa === item.ticketId} onSelect={() => setActiva(item.ticketId)} />
            ))
          )}
        </nav>
      </div>

      {/* ── CONVERSACIÓN (44%) ── */}
      <div className="flex w-[44%] min-w-0 flex-col border-r border-black-10 bg-white overflow-hidden">
        {!ticketActivo ? (
          <div className="flex h-full items-center justify-center text-[11px] text-black-25">
            {loadingTicket ? <Loader2 size={18} className="animate-spin" /> : "Seleccione una atención"}
          </div>
        ) : ticket ? (
          <>
            <ConversationHeader ticket={ticket} tiempoAbierto={calcTiempoAbierto(ticket.createdAt)} />
            <div className="shrink-0 px-3 py-1.5">
              <QuickSummary mensajes={conversacion} />
            </div>
            <div className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: "none" }}>
              <MessageTimeline mensajes={conversacion} />
            </div>
            <ContextActions ticketId={ticket.id} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-black-25">Cargando ticket...</div>
        )}
      </div>

      {/* ── WORKSPACE (32%) ── */}
      <div className="flex w-[32%] min-w-[280px] shrink-0 flex-col bg-light overflow-hidden">
        {!ticketActivo ? (
          <div className="flex h-full items-center justify-center text-[11px] text-black-25">Seleccione una atención</div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-3" style={{ scrollbarWidth: "none" }}>
            <Section titulo="Cliente">
              <Row label="Nombre" value={ticketActivo.requesterName} />
              <Row label="Correo" value={ticketActivo.requesterEmail} />
              <Row label="Canal" value="Zendesk" />
              <Row label="Ticket" value={`#${ticketActivo.ticketId}`} />
              <Row label="Estado" value={ESTADO[ticketActivo.status]?.label ?? ticketActivo.status} />
              <Row label="Prioridad" value={ticketActivo.priority} />
            </Section>
            <Section titulo="Cliente 360°">
              <ModuloCliente360Real clienteId={ticket?.clienteId} />
            </Section>
            <Section titulo="Diagnóstico">
              <ModuloDiagnosticoOperativo />
            </Section>
            <Section titulo="Workspace adaptativo">
              <WorkspaceFactory categoria={ticketActivo.subject} />
            </Section>
            <Section titulo="Guías">
              <p className="text-[11px] text-black-25">No existe una guía disponible.</p>
            </Section>
            <Section titulo="Actividades">
              <p className="text-[11px] text-black-25">Las actividades se registrarán automáticamente.</p>
            </Section>
            <Section titulo="Resultado">
              <Row label="Estado atención" value={ESTADO[ticketActivo.status]?.label ?? ticketActivo.status} />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-black-25">{titulo}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-black-25 text-[11px]">{label}</span>
      <span className="font-medium text-black-85 text-[12px]">{value ?? <ND />}</span>
    </div>
  );
}
