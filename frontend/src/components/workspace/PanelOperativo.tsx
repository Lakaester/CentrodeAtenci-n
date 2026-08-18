import { useEffect, useState } from "react";
import { User, Globe, BarChart3, Target, Wrench, BookOpen, Activity, CheckSquare, Plus, Layers, Stethoscope } from "lucide-react";
import { categoriaDesdeSubcategoria } from "./CategoryData";
import type { CustomerInfo, TicketDetail } from "@/hooks/useTicketDetail";
import { useCustomerHistory } from "@/hooks/useCustomerHistory";
import { api } from "@/lib/api";
import { localbiService } from "@/modules/localbi/services/LocalbiService";
import { HistoriaClientePanel } from "./HistoriaClientePanel";

interface Props {
  customer: CustomerInfo | null;
  ticket: TicketDetail | null;
  clienteCope?: Record<string, any> | null;
  onOpenTicket?: (ticketId: string) => void;
}

function Modulo({ titulo, icon, children, defaultOpen = false }: { titulo: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-black-10 last:border-b-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-black-45 hover:bg-light">
        <span className="text-primary">{icon}</span>
        <span className="uppercase tracking-wider">{titulo}</span>
        <span className="ml-auto text-[8px] text-black-25">{open ? "-" : "+"}</span>
      </button>
      {open && <div className="px-2.5 pb-2 space-y-1">{children}</div>}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-black-25">{label}</span>
      <span className="max-w-[60%] truncate text-right text-[10px] font-medium text-black-85">{children}</span>
    </div>
  );
}

function ND() { return <span className="text-black-10">—</span>; }

export function PanelOperativo({ customer, ticket, clienteCope, onOpenTicket }: Props) {
  const [editDominio, setEditDominio] = useState(false);
  const [nuevoDominio, setNuevoDominio] = useState("");
  const [dominiosAdicionales, setDominiosAdicionales] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const { history, loading: historyLoading } = useCustomerHistory(
    ticket?.requesterId ? String(ticket.requesterId) : null,
  );

  const dominioActual = ticket?.dominio;

  // Auto-detección de la unidad de negocio desde el dominio de la atención.
  // Resuelve dominio → unidad SOLO si la búsqueda devuelve un resultado inequívoco.
  // Si no hay dominio, hay varios resultados o ninguno → queda el selector manual.
  const [unidadDetectada, setUnidadDetectada] = useState<{ unidad_negocio: string; nombre?: string } | null>(null);
  useEffect(() => {
    let activo = true;
    setUnidadDetectada(null);
    if (!dominioActual || !dominioActual.trim()) return;
    localbiService
      .buscarUnidades(dominioActual.trim(), 1, 50)
      .then((res) => {
        if (!activo) return;
        if ((res.status === "success" || res.status === "warning") && res.data.unidades.length === 1) {
          const u = res.data.unidades[0];
          setUnidadDetectada({ unidad_negocio: u.unidad_negocio, nombre: u.nombre });
        }
      })
      .catch(() => { /* sin unidad detectable: se mantiene el selector manual */ });
    return () => { activo = false; };
  }, [dominioActual]);

  const guardarDominio = async () => {
    if (!nuevoDominio.trim() || !ticket?.ticketOriginalId) return;
    setGuardando(true);
    try {
      await api.put(`/zendesk/tickets/${ticket.ticketOriginalId}/domain`, {
        dominio: nuevoDominio.trim(),
        email: ticket.clienteEmail,
      });
      if (dominioActual && dominioActual !== nuevoDominio.trim()) {
        setDominiosAdicionales([...dominiosAdicionales, nuevoDominio.trim()]);
      }
      setNuevoDominio("");
      setEditDominio(false);
    } catch { /* ignore */ } finally { setGuardando(false); }
  };

  const todosLosDominios = dominioActual
    ? [dominioActual, ...dominiosAdicionales].filter(Boolean)
    : [];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
      <div className="border-b border-black-10">
        <button type="button" className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-black-45 hover:bg-light">
          <span className="text-primary"><Stethoscope size={11} /></span>
          <span className="uppercase tracking-wider">Historia del Cliente</span>
        </button>
        <HistoriaClientePanel unidadInicial={unidadDetectada} />
      </div>

      <Modulo titulo="Informacion del cliente" icon={<User size={11} />} defaultOpen>
        <Info label="Nombre">{clienteCope?.nombre ?? customer?.nombre ?? <ND />}</Info>
        <Info label="Correo ppal.">{clienteCope?.correoPrincipal || customer?.correo || <ND />}</Info>
        {clienteCope?.correosSecundarios?.length > 0 && (
          <Info label="Correos sec.">{(clienteCope!.correosSecundarios as string[]).join(", ")}</Info>
        )}
        {clienteCope?.empresa && <Info label="Empresa">{clienteCope.empresa as string}</Info>}
        {clienteCope?.pais && <Info label="Pais">{clienteCope.pais as string}</Info>}
      </Modulo>

      <Modulo titulo="Dominio" icon={<Globe size={11} />} defaultOpen>
        {((clienteCope?.dominios as string[] | undefined)?.length ?? 0) > 0 ? (
          ((clienteCope?.dominios as string[] | undefined) ?? todosLosDominios).map((d: string, i: number) => (
            <div key={i} className="flex items-center justify-between rounded bg-light px-1.5 py-1">
              <span className="text-[10px] font-medium text-black-85">{d}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-1.5 rounded bg-warning-5 px-2 py-1.5">
            <span className="text-[10px] text-warning-65">No identificado</span>
          </div>
        )}
        {editDominio ? (
          <div className="mt-1 space-y-1">
            <input type="text" value={nuevoDominio} onChange={(e) => setNuevoDominio(e.target.value)}
              placeholder="ej: michi.pe"
              className="w-full rounded border border-black-10 px-1.5 py-1 text-[10px] focus:border-primary focus:outline-none"
              autoFocus
            />
            <div className="flex gap-1">
              <button type="button" onClick={guardarDominio} disabled={guardando || !nuevoDominio.trim()}
                className="rounded bg-primary px-2 py-0.5 text-[9px] text-white disabled:opacity-40">
                {guardando ? "..." : "Guardar"}
              </button>
              <button type="button" onClick={() => setEditDominio(false)}
                className="rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-45">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setEditDominio(true)}
            className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded border border-black-10 px-2 py-1 text-[9px] text-primary hover:bg-primary-5">
            <Plus size={10} /> {todosLosDominios.length > 0 ? "Agregar dominio" : "Vincular dominio"}
          </button>
        )}
      </Modulo>

      <Modulo titulo="Historial del cliente" icon={<BarChart3 size={11} />} defaultOpen>
        {clienteCope ? (
          <>
            <Info label="Total en COPE">{clienteCope.totalTickets} tickets</Info>
            <Info label="Primer contacto">{clienteCope.primerContacto ? new Date(clienteCope.primerContacto).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : <ND />}</Info>
            <Info label="Ultimo contacto">{clienteCope.ultimoContacto ? new Date(clienteCope.ultimoContacto).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : <ND />}</Info>
            {clienteCope.categorias?.length > 0 && <Info label="Categorias usadas">{clienteCope.categorias.slice(0, 3).join(", ")}</Info>}
          </>
        ) : historyLoading ? (
          <div className="py-2 text-[10px] text-black-25">Cargando historial...</div>
        ) : history ? (
          <>
            <Info label="Total">{history.total} atenciones</Info>
            <Info label="Primera">{history.primeraAtencion ? new Date(history.primeraAtencion).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : <ND />}</Info>
            <Info label="Ultima">{history.ultimaAtencion ? new Date(history.ultimaAtencion).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : <ND />}</Info>
            {history.tiempoPromedioResolucion !== null && (
              <Info label="Tiempo prom.">{Math.round(history.tiempoPromedioResolucion / 60)} h</Info>
            )}
            <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
              {history.tickets.slice(0, 10).map((t) => (
                <button key={t.id} type="button"
                  onClick={() => onOpenTicket?.(t.id)}
                  className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-[9px] text-left hover:bg-light">
                  <span className="shrink-0 font-mono text-primary">#{t.id}</span>
                  <span className="truncate text-black-85">{t.asunto || "—"}</span>
                  <span className={[
                    "ml-auto shrink-0 rounded px-1 text-[8px] font-medium",
                    t.estado === "solved" ? "bg-black-5 text-black-65" :
                    t.estado === "closed" ? "bg-black-5 text-black-45" :
                    t.estado === "open" ? "bg-primary-5 text-primary" :
                    t.estado === "pending" ? "bg-warning-5 text-warning-65" :
                    "bg-success-5 text-success"
                  ].join(" ")}>{t.estado}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <Info label="Historial"><ND /></Info>
        )}
      </Modulo>

      <Modulo titulo="Diagnostico" icon={<Target size={11} />}>
        <Info label="Hipotesis"><ND /></Info>
        <Info label="Observaciones"><ND /></Info>
      </Modulo>

      <Modulo titulo="Herramientas" icon={<Wrench size={11} />}>
        <Info label="Facturacion"><ND /></Info>
        <Info label="Integraciones"><ND /></Info>
        <Info label="Logistica"><ND /></Info>
      </Modulo>

      <Modulo titulo="Guias y procedimientos" icon={<BookOpen size={11} />}>
        <Info label="Procedimientos"><ND /></Info>
        <Info label="Documentacion"><ND /></Info>
      </Modulo>

      <Modulo titulo="Categorizacion" icon={<Layers size={11} />}>
        <Info label="Categoria">
          {ticket?.tags?.[0] ? (categoriaDesdeSubcategoria(ticket.tags[0]) ?? <ND />) : ((clienteCope?.categorias as string[] | undefined)?.join(", ") ?? <ND />)}
        </Info>
        <Info label="Subcategoria">
          {ticket?.tags?.[0] ?? ((clienteCope?.subcategorias as string[] | undefined)?.join(", ") ?? <ND />)}
        </Info>
      </Modulo>

      <Modulo titulo="Actividades" icon={<Activity size={11} />}>
        <Info label="Historial de la atencion"><ND /></Info>
        <Info label="Eventos"><ND /></Info>
      </Modulo>

      <Modulo titulo="Resultado de la atencion" icon={<CheckSquare size={11} />}>
        <Info label="Estado de la atencion">
          {ticket ? (
            <span className={["rounded px-1 py-0.5 text-[9px] font-medium",
              ticket.ticketOriginalStatus === "new" ? "bg-success-5 text-success" :
              ticket.ticketOriginalStatus === "solved" ? "bg-black-5 text-black-65" :
              ticket.ticketOriginalStatus === "closed" ? "bg-black-5 text-black-45" :
              "bg-primary-5 text-primary"
            ].join(" ")}>
              {ticket.ticketOriginalStatus === "new" ? "Nuevo" :
               ticket.ticketOriginalStatus === "solved" ? "Resuelto" :
               ticket.ticketOriginalStatus === "closed" ? "Cerrado" :
               ticket.ticketOriginalStatus === "pending" ? "Pendiente" :
               "Abierto"}
            </span>
          ) : <ND />}
        </Info>
      </Modulo>
    </div>
  );
}
