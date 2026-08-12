import { useMemo, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { TicketDTO } from "./useTickets";
import { cn } from "@/lib/utils";

type FiltroVista = "todas" | "sin_asignar" | "mis_atenciones" | "esperando_cliente" | "resueltas" | "cerradas";

interface Props {
  tickets: TicketDTO[];
  loading?: boolean;
  activa: string | null;
  onSelect: (id: string) => void;
  asesorActual?: string;
}

const VISTAS: { key: FiltroVista; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "sin_asignar", label: "Sin asignar" },
  { key: "mis_atenciones", label: "Mis Atenciones" },
  { key: "esperando_cliente", label: "Esperando Cliente" },
  { key: "resueltas", label: "Resueltas" },
  { key: "cerradas", label: "Cerradas" },
];

const CANAL_LABEL: Record<string, string> = {
  whaticket: "WA",
  meta: "Meta",
  zendesk: "Zendesk",
  correo: "Correo",
};

const CANAL_COLOR: Record<string, string> = {
  whaticket: "text-success",
  meta: "text-purple",
  zendesk: "text-primary",
  correo: "text-primary",
};

export function BandejaInteligente({ tickets, loading, activa, onSelect, asesorActual = "Tú" }: Props) {
  const [vista, setVista] = useState<FiltroVista>("todas");
  const [search, setSearch] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const filtrados = useMemo(() => {
    return tickets
      .filter((t) => {
        switch (vista) {
          case "sin_asignar": return t.status === "PENDIENTE" && (!t.asesorNombre || t.asesorNombre !== asesorActual);
          case "mis_atenciones": return t.status === "EN_PROCESO" && t.asesorNombre === asesorActual;
          case "esperando_cliente": return t.status === "PENDIENTE" && t.asesorNombre === asesorActual;
          case "resueltas": return t.status === "RESUELTO";
          case "cerradas": return t.status === "CERRADO";
          default: return true;
        }
      })
      .filter((t) => !filtroCanal || t.channel === filtroCanal)
      .filter((t) => !filtroEstado || t.status === filtroEstado)
      .filter((t) => !filtroCategoria || t.categoriaFinal === filtroCategoria)
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.clienteNombre.toLowerCase().includes(q) ||
          t.clienteDominio.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.asunto.toLowerCase().includes(q) ||
          (t.categoriaFinal ?? "").toLowerCase().includes(q) ||
          (t.ultimoMensaje ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.slaVencido && !b.slaVencido) return -1;
        if (!a.slaVencido && b.slaVencido) return 1;
        return b.priorityScore - a.priorityScore;
      });
  }, [tickets, vista, search, filtroCanal, filtroEstado, filtroCategoria, asesorActual]);

  const conteos = useMemo(() => ({
    todas: tickets.length,
    sin_asignar: tickets.filter((t) => t.status === "PENDIENTE" && (!t.asesorNombre || t.asesorNombre !== asesorActual)).length,
    mis_atenciones: tickets.filter((t) => t.status === "EN_PROCESO" && t.asesorNombre === asesorActual).length,
    esperando_cliente: tickets.filter((t) => t.status === "PENDIENTE" && t.asesorNombre === asesorActual).length,
    resueltas: tickets.filter((t) => t.status === "RESUELTO").length,
    cerradas: tickets.filter((t) => t.status === "CERRADO").length,
  }), [tickets, asesorActual]);

  const categorias = useMemo(() => {
    const set = new Set(tickets.map((t) => t.categoriaFinal).filter(Boolean));
    return Array.from(set) as string[];
  }, [tickets]);

  return (
    <div className="flex h-full flex-col">
      {/* Filtros de vista (primera fila) */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-black-10 px-2 py-2">
        {VISTAS.map((v) => (
          <button key={v.key} onClick={() => setVista(v.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              vista === v.key
                ? "bg-primary text-white"
                : "bg-black-5 text-black-45 hover:bg-black-10",
            )}
          >
            {v.label}
            <span className={cn("ml-1.5 text-[10px]", vista === v.key ? "text-white/70" : "text-black-25")}>
              {conteos[v.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Barra de filtros + búsqueda (segunda fila) */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-black-10 p-2">
        <div className="relative min-w-[160px] flex-1">
          <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-25" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, dominio, ticket..."
            className="w-full rounded-md border border-black-10 bg-light py-1 pl-7 pr-2 text-[11px] text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-black-25"><X size={12} /></button>}
        </div>
        <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)}
          className="rounded-md border border-black-10 bg-light px-2 py-1 text-[11px] text-black-85 focus:border-[#2563EB] focus:outline-none">
          <option value="">Canal: Todos</option>
          <option value="whaticket">Whaticket</option>
          <option value="meta">Meta</option>
          <option value="zendesk">Zendesk</option>
          <option value="correo">Correo</option>
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-md border border-black-10 bg-light px-2 py-1 text-[11px] text-black-85 focus:border-[#2563EB] focus:outline-none">
          <option value="">Estado: Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="RESUELTO">Resuelto</option>
          <option value="CERRADO">Cerrado</option>
        </select>
        {categorias.length > 0 && (
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-md border border-black-10 bg-light px-2 py-1 text-[11px] text-black-85 focus:border-[#2563EB] focus:outline-none">
            <option value="">Categoría: Todas</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Lista de tickets */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 size={20} className="animate-spin text-black-25" /></div>
        ) : filtrados.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-black-25">No hay tickets en esta sección</div>
        ) : (
          filtrados.map((t) => {
            const estaActivo = activa === t.id;
            const canalLabel = CANAL_LABEL[t.channel] ?? t.channel;
            const canalColor = CANAL_COLOR[t.channel] ?? "text-black-45";
            const inic = t.clienteNombre.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
            const tiempo = t.createdAt ? Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 60000) : 0;
            return (
              <button key={t.id} onClick={() => onSelect(t.id)}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left text-xs transition-all",
                  estaActivo ? "border-[#2563EB] bg-primary-5 " : "border-black-5 hover:border-black-10 hover:bg-light",
                  t.slaVencido && !estaActivo && "border-l-rose-400",
                )}
              >
                <div className="flex items-center gap-1.5">
                  {t.slaVencido && <span className="rounded bg-danger-5 px-1 py-0 text-[9px] font-semibold text-danger">SLA</span>}
                  {t.priority === "ALTA" && <span className="rounded bg-warning-5 px-1 py-0 text-[9px] font-semibold text-warning">ALTA</span>}
                  {!t.categoriaFinal && <span className="rounded bg-danger-5 px-1 py-0 text-[9px] font-semibold text-danger">S/Cat</span>}
                  {t.status === "PENDIENTE" && <span className="rounded bg-success-5 px-1 py-0 text-[9px] font-semibold text-success">Nuevo</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[9px] font-semibold text-primary">{inic}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-black-85">{t.clienteNombre}</p>
                    <p className="truncate text-[10px] text-black-45">{t.clienteDominio}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-black-45">
                  <span className={cn("font-medium", canalColor)}>{canalLabel}</span>
                  <span>·</span>
                  <span>{t.pais}</span>
                  {t.categoriaFinal && <><span>·</span><span>{t.categoriaFinal}</span></>}
                  <span className="ml-auto flex items-center gap-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full", t.status === "PENDIENTE" ? "bg-slate-400" : t.status === "EN_PROCESO" ? "bg-primary" : "bg-success-50")} />
                    <span>{t.status === "PENDIENTE" ? "Pendiente" : t.status === "EN_PROCESO" ? "En proceso" : "Cerrado"}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={cn("rounded px-1 py-0.5 text-[9px] font-semibold",
                    t.slaVencido ? "bg-danger-5 text-danger" : t.slaPorcentaje >= 70 ? "bg-warning-5 text-warning-65" : "bg-success-5 text-success")}>
                    SLA {t.slaVencido ? "Vencido" : t.slaPorcentaje >= 70 ? "Próximo" : "OK"}
                  </span>
                  <span className="text-black-25">⏱ {tiempo >= 60 ? `${Math.floor(tiempo / 60)}h` : `${tiempo} min`}</span>
                  <span className="text-black-25">{t.ultimoMensajeEn ? new Date(t.ultimoMensajeEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
                <p className="truncate text-[10px] text-black-25">{t.ultimoMensaje ?? t.asunto}</p>
              </button>
            );
          })
        )}
      </nav>
    </div>
  );
}
