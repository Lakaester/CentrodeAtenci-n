import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Download,
  Search,
  Users,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, fmtDur, KpiCard, Section } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { CHART } from "@/lib/chartPalette";

/* ─── Tipos ─── */
interface ClienteResumen {
  cliente: string;
  clave: string;
  total: number;
  pct: number;
  variacionPct: number | null;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
  reincidenciaMax: number;
  canales: string[];
  esNoIdentificado: boolean;
  ultimaAtencion: string | null;
}

interface ClienteSeguimiento {
  cliente: string;
  clave: string;
  total: number;
  totalAnterior: number;
  variacionPct: number | null;
  reincidenciaMax: number;
  subcategoriaRecurrente: string | null;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
  motivos: string[];
  senales: number;
}

interface ClientesV2Response {
  universo: {
    total: number;
    totalAnterior: number | null;
    variacionPct: number | null;
    rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  };
  kpis: {
    clientesIdentificados: number;
    atenciones: number;
    atencionesIdentificadas: number;
    atencionesNoIdentificadas: number;
    pctNoIdentificadas: number;
    promedioAtenciones: number;
    clientesConSeguimiento: number;
    clientesMulticanal: number;
  };
  calidad: {
    atencionesNoIdentificadas: number;
    pctNoIdentificadas: number;
    dominiosInvalidos: number;
    numerosDistintos: number;
    identificadosPorCorreo: number;
  };
  canales: { ambos: number; soloWhatsapp: number; soloCorreo: number; total: number };
  ranking: ClienteResumen[];
  rankingTotal: number;
  seguimiento: ClienteSeguimiento[];
  seguimientoTotal: number;
}

interface ClientesListaResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: ClienteResumen[];
}

interface ClienteCategoria {
  categoria: string;
  total: number;
  pct: number;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
}

interface ClienteCategoriasResponse {
  cliente: string;
  clave: string;
  esNoIdentificado: boolean;
  total: number;
  categorias: ClienteCategoria[];
}

interface ClienteSubcategoria extends ClienteCategoria {
  subcategoria: string;
}

interface ClienteSubcategoriasResponse {
  cliente: string;
  clave: string;
  categoria: string;
  esNoIdentificado: boolean;
  total: number;
  subcategorias: ClienteSubcategoria[];
}

interface ClienteTicket {
  ticket: string;
  canal: string;
  fecha: string;
  categoria: string;
  subcategoria: string;
  dominio: string;
  contacto: string | null;
  numero: string | null;
  asesor: string;
  estado: string;
  tiempoResolucion: number | null;
  cumpleSla: boolean | null;
  umbralMinutos: number;
  urlTicket: string | null;
}

interface ClienteTicketsResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: ClienteTicket[];
}

interface ClienteEvolucionResponse {
  cliente: string;
  clave: string;
  esNoIdentificado: boolean;
  granularidad: "diaria" | "semanal" | "mensual";
  actual: { periodo: string; total: number }[];
  anterior: { periodo: string; total: number }[];
  totalActual: number;
  totalAnterior: number;
  variacionPct: number | null;
}

type Granularidad = "diaria" | "semanal" | "mensual";
type NivelExportacion = "clientes" | "categorias" | "subcategorias" | "tickets";
type SenalFiltro = "todas" | "sla" | "tiempo" | "aumento" | "reincidencia";

const SIN_IDENTIFICAR = "__sin_identificar__";
const PAGE_SIZE_CLIENTES = 25;
const PAGE_SIZE_TICKETS = 25;

const fmt1 = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-PE", { maximumFractionDigits: 1 });
const fmt2 = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-PE", { maximumFractionDigits: 2 });
const fmtPct1 = (n: number | null | undefined) => (n == null ? "—" : `${fmt1(n)}%`);

const canalLabel = (c: string) => {
  const v = (c ?? "").toUpperCase();
  if (v === "WHATMETA") return "WAMETA";
  if (v === "WHATICKET") return "WATICKET";
  if (v === "ZENDESK") return "ZENDESK";
  return c;
};

const estadoLabel = (e: string) => {
  const v = (e ?? "").toLowerCase();
  if (v === "cerrado") return "Cerrado";
  if (v === "resuelto") return "Resuelto";
  if (v === "abierto") return "Abierto";
  if (v === "sin_mapear") return "Sin homologar";
  return e;
};

const canalNombre = (c: string) => (c === "whatsapp" ? "WhatsApp" : c === "correo" ? "Correo" : c);

const variacionClass = (v: number | null) =>
  v == null || v === 0 ? "text-black-45" : v > 0 ? "text-danger" : "text-success";

const motivoStyle = (motivo: string) => {
  if (motivo.startsWith("Aumento")) return "border-sky-200 bg-sky-50 text-sky-700";
  if (motivo.startsWith("Reincidencia")) return "border-violet-200 bg-violet-50 text-violet-700";
  if (motivo.startsWith("Tiempo")) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
};

async function fetchSummary(params: Record<string, string>): Promise<ClientesV2Response> {
  const { data } = await api.get("/dashboard/clientes-v2", { params });
  return data.data as ClientesV2Response;
}

async function fetchClientes(
  params: Record<string, string>,
): Promise<ClientesListaResponse> {
  const { data } = await api.get("/dashboard/clientes-v2/clientes", { params });
  return data.data as ClientesListaResponse;
}

async function fetchCategorias(
  params: Record<string, string>,
): Promise<ClienteCategoriasResponse> {
  const { data } = await api.get("/dashboard/clientes-v2/categorias", { params });
  return data.data as ClienteCategoriasResponse;
}

async function fetchSubcategorias(
  params: Record<string, string>,
): Promise<ClienteSubcategoriasResponse> {
  const { data } = await api.get("/dashboard/clientes-v2/subcategorias", { params });
  return data.data as ClienteSubcategoriasResponse;
}

async function fetchTickets(
  params: Record<string, string>,
): Promise<ClienteTicketsResponse> {
  const { data } = await api.get("/dashboard/clientes-v2/tickets", { params });
  return data.data as ClienteTicketsResponse;
}

async function fetchEvolucion(
  params: Record<string, string>,
): Promise<ClienteEvolucionResponse> {
  const { data } = await api.get("/dashboard/clientes-v2/evolucion", { params });
  return data.data as ClienteEvolucionResponse;
}

/* ─── UI pequeña ─── */
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SlaBadge({
  pctIncumple,
  noCumple,
  conDato,
}: {
  pctIncumple: number | null;
  noCumple: number;
  conDato: number;
}) {
  if (conDato === 0) return <span className="text-xs text-black-25">Sin dato</span>;
  const ok = (pctIncumple ?? 0) <= 30;
  return (
    <span className="inline-flex flex-col items-end">
      <Badge
        className={
          ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-rose-200 bg-rose-50 text-rose-700"
        }
      >
        {fmtPct1(pctIncumple)}
      </Badge>
      <span className="mt-0.5 text-[10px] text-black-25">
        {fmtNum(noCumple)}/{fmtNum(conDato)}
      </span>
    </span>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-black-45">
      <span>
        Página {page} de {pages} · {fmtNum(total)} registros
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded border border-black-10 px-2 py-1 disabled:opacity-40"
        >
          <ArrowLeft size={12} />
        </button>
        <button
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
          className="rounded border border-black-10 px-2 py-1 disabled:opacity-40"
        >
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  KPIs + calidad                                                 */
/* ════════════════════════════════════════════════════════════════ */
function Kpis({ data }: { data: ClientesV2Response }) {
  const k = data.kpis;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<Users size={18} />}
        label="Clientes identificados"
        value={fmtNum(k.clientesIdentificados)}
        hint={`${fmtNum(k.clientesMulticanal)} multicanal · ${fmtNum(
          data.calidad.identificadosPorCorreo,
        )} recuperados por correo`}
      />
      <KpiCard
        icon={<BarChart3 size={18} />}
        label="Atenciones finalizadas"
        value={fmtNum(k.atenciones)}
        hint={`${fmtNum(k.atencionesNoIdentificadas)} sin identificar (${fmtPct1(
          k.pctNoIdentificadas,
        )})`}
      />
      <KpiCard
        icon={<Users size={18} />}
        label="Promedio por cliente"
        value={fmt2(k.promedioAtenciones)}
        hint={`${fmtNum(k.atencionesIdentificadas)} atenciones atribuidas`}
      />
      <KpiCard
        icon={<AlertTriangle size={18} />}
        label="Clientes con seguimiento"
        value={fmtNum(k.clientesConSeguimiento)}
        hint="Al menos 2 señales objetivas"
      />
    </div>
  );
}

function CalidadFranja({ data }: { data: ClientesV2Response }) {
  const c = data.calidad;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-900">
      <p className="font-medium">Calidad de identificación</p>
      <p className="mt-1">
        {fmtNum(c.atencionesNoIdentificadas)} atenciones sin identificar (
        {fmtPct1(c.pctNoIdentificadas)} del total) · {fmtNum(c.numerosDistintos)} números o
        correos distintos · {fmtNum(c.dominiosInvalidos)} dominios inválidos. No se contabilizan
        como clientes ni entran en rankings, promedios o seguimiento.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Seguimiento                                                    */
/* ════════════════════════════════════════════════════════════════ */
function SeguimientoTable({
  items,
  onSelect,
}: {
  items: ClienteSeguimiento[];
  onSelect: (cliente: ClienteSeguimiento) => void;
}) {
  const [filtro, setFiltro] = useState<SenalFiltro>("todas");

  const filtrados = useMemo(() => {
    if (filtro === "todas") return items;
    const needle =
      filtro === "sla"
        ? "Incumplimiento SLA"
        : filtro === "tiempo"
          ? "Tiempo promedio"
          : filtro === "aumento"
            ? "Aumento de demanda"
            : "Reincidencia";
    return items.filter((r) => r.motivos.some((m) => m.startsWith(needle)));
  }, [items, filtro]);

  const filtros: { id: SenalFiltro; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "sla", label: "SLA" },
    { id: "tiempo", label: "Tiempo" },
    { id: "aumento", label: "Aumento" },
    { id: "reincidencia", label: "Reincidencia" },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filtro === f.id
                ? "border-primary bg-primary text-white"
                : "border-black-10 bg-white text-black-45 hover:text-black-85",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-black-25">
          {fmtNum(filtrados.length)} clientes
        </span>
      </div>

      <div className="max-h-[430px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-3">Cliente</th>
              <th className="pb-2 pr-3 text-right">Atenciones</th>
              <th className="pb-2 pr-3 text-right">Variación</th>
              <th className="pb-2 pr-3 text-right">Reincidencia</th>
              <th className="pb-2 pr-3 text-right">Tiempo prom.</th>
              <th className="pb-2 pr-3 text-right">Incumpl. SLA</th>
              <th className="pb-2">Motivos</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr
                key={r.clave}
                className="cursor-pointer border-t border-black-5 align-top hover:bg-black-5"
                onClick={() => onSelect(r)}
              >
                <td className="py-2.5 pr-3 font-medium text-black-85">
                  <span className="flex items-center gap-1.5">
                    {r.cliente}
                    <ChevronRight size={12} className="text-black-25" />
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right text-black-85">{fmtNum(r.total)}</td>
                <td className={cn("py-2.5 pr-3 text-right text-xs", variacionClass(r.variacionPct))}>
                  {r.variacionPct == null ? "—" : `${r.variacionPct > 0 ? "+" : ""}${fmt1(r.variacionPct)}%`}
                </td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-45">
                  {r.reincidenciaMax > 0 ? (
                    <span title={r.subcategoriaRecurrente ?? undefined}>
                      {fmtNum(r.reincidenciaMax)}
                      <span className="ml-1 text-[10px]">tickets</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-85">
                  {fmtDur(r.tiempoPromedio)}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <SlaBadge pctIncumple={r.pctIncumple} noCumple={r.noCumple} conDato={r.conDato} />
                </td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {r.motivos.map((m) => (
                      <Badge key={m} className={motivoStyle(m)}>
                        {m}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-black-25">
                  Sin clientes para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-black-25">
        Un cliente entra con al menos 3 atenciones y 2 señales. “Aumento de demanda” se muestra en
        azul y no implica deterioro del servicio. No se afirma riesgo comercial: no hay datos de
        satisfacción, bajas o cancelación.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Explorador                                                     */
/* ════════════════════════════════════════════════════════════════ */
function Explorador({
  params,
  summary,
  exportando,
  onExport,
  selected,
  onSelect,
}: {
  params: Record<string, string>;
  summary: ClientesV2Response;
  exportando: boolean;
  onExport: (nivel: NivelExportacion, extra?: Record<string, string>) => void;
  selected: { clave: string; nombre: string; esNoIdentificado: boolean } | null;
  onSelect: (cliente: { clave: string; nombre: string; esNoIdentificado: boolean } | null) => void;
}) {
  const [clientePage, setClientePage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [subcategoria, setSubcategoria] = useState<string | null>(null);
  const [ticketPage, setTicketPage] = useState(1);

  useEffect(() => {
    setClientePage(1);
  }, [search, params]);

  useEffect(() => {
    setCategoria(null);
    setSubcategoria(null);
    setTicketPage(1);
  }, [selected?.clave]);

  useEffect(() => {
    setSubcategoria(null);
    setTicketPage(1);
  }, [categoria]);

  useEffect(() => {
    setTicketPage(1);
  }, [subcategoria]);

  const clientesQuery = useQuery({
    queryKey: ["clientes-v2-lista", params, clientePage, search],
    queryFn: () =>
      fetchClientes({
        ...params,
        page: String(clientePage),
        pageSize: String(PAGE_SIZE_CLIENTES),
        search,
      }),
    refetchOnWindowFocus: false,
  });

  const categoriasQuery = useQuery({
    queryKey: ["clientes-v2-categorias", params, selected?.clave],
    queryFn: () => fetchCategorias({ ...params, clave: selected!.clave }),
    enabled: !!selected,
    refetchOnWindowFocus: false,
  });

  const subcategoriasQuery = useQuery({
    queryKey: ["clientes-v2-subcategorias", params, selected?.clave, categoria],
    queryFn: () =>
      fetchSubcategorias({ ...params, clave: selected!.clave, cat: categoria! }),
    enabled: !!selected && !!categoria,
    refetchOnWindowFocus: false,
  });

  const ticketsQuery = useQuery({
    queryKey: [
      "clientes-v2-tickets",
      params,
      selected?.clave,
      categoria,
      subcategoria,
      ticketPage,
    ],
    queryFn: () =>
      fetchTickets({
        ...params,
        clave: selected!.clave,
        cat: categoria!,
        subcat: subcategoria!,
        page: String(ticketPage),
        pageSize: String(PAGE_SIZE_TICKETS),
      }),
    enabled: !!selected && !!categoria && !!subcategoria,
    refetchOnWindowFocus: false,
  });

  const sinIdentificados = {
    clave: SIN_IDENTIFICAR,
    nombre: "No identificados",
    esNoIdentificado: true,
  };

  const nivel: NivelExportacion = subcategoria
    ? "tickets"
    : categoria
      ? "subcategorias"
      : selected
        ? "categorias"
        : "clientes";

  const extraExport: Record<string, string> = {};
  if (nivel === "clientes") {
    if (search) extraExport.search = search;
  } else if (nivel === "categorias") {
    extraExport.clave = selected!.clave;
  } else if (nivel === "subcategorias") {
    extraExport.clave = selected!.clave;
    extraExport.cat = categoria!;
  } else {
    extraExport.clave = selected!.clave;
    extraExport.cat = categoria!;
    extraExport.subcat = subcategoria!;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-black-25">
          Cliente → Categoría → Subcategoría → Tickets. El detalle respeta los filtros globales.
        </p>
        <button
          onClick={() => onExport(nivel, extraExport)}
          disabled={exportando}
          className="flex items-center gap-1.5 rounded-lg border border-black-10 px-3 py-1.5 text-xs font-medium text-black-65 transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
        >
          <Download size={13} />
          {exportando
            ? "Exportando…"
            : nivel === "clientes"
              ? "Exportar clientes"
              : nivel === "categorias"
                ? "Exportar categorías"
                : nivel === "subcategorias"
                  ? "Exportar subcategorías"
                  : "Exportar tickets"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de clientes */}
        <div className="rounded-xl border border-black-10">
          <div className="border-b border-black-10 p-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black-25"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className="w-full rounded-lg border border-black-10 py-1.5 pl-9 pr-3 text-xs text-black-85 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2 text-right">Atenc.</th>
                  <th className="px-3 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {(clientesQuery.data?.rows ?? []).map((r) => (
                  <tr
                    key={r.clave}
                    onClick={() =>
                      onSelect({ clave: r.clave, nombre: r.cliente, esNoIdentificado: false })
                    }
                    className={cn(
                      "cursor-pointer border-t border-black-5 hover:bg-black-5",
                      selected?.clave === r.clave && "bg-primary-10",
                    )}
                  >
                    <td className="max-w-[170px] truncate px-3 py-1.5 text-xs text-black-85">
                      {r.cliente}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs text-black-45">
                      {fmtNum(r.total)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs text-black-45">
                      {fmtPct1(r.pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => onSelect(sinIdentificados)}
              className={cn(
                "flex w-full items-center justify-between gap-2 border-t border-dashed border-black-10 px-3 py-2 text-left hover:bg-black-5",
                selected?.clave === SIN_IDENTIFICAR && "bg-primary-10",
              )}
            >
              <span className="flex items-center gap-2 text-xs text-black-45">
                <span className="inline-block h-2 w-2 rounded-full bg-black-25" />
                No identificados
                <Badge className="border-black-10 bg-black-5 text-black-45">calidad</Badge>
              </span>
              <span className="text-xs text-black-45">
                {fmtNum(summary.calidad.atencionesNoIdentificadas)}
              </span>
            </button>
          </div>

          <div className="border-t border-black-10 px-3 pb-3">
            <Pagination
              page={clientePage}
              pageSize={PAGE_SIZE_CLIENTES}
              total={clientesQuery.data?.total ?? 0}
              onChange={setClientePage}
            />
          </div>
        </div>

        {/* Detalle */}
        <div className="min-h-[430px] rounded-xl border border-black-10 p-4">
          {!selected ? (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
              <Users size={38} className="mb-3 text-black-10" />
              <p className="text-sm text-black-25">
                Selecciona un cliente para explorar categorías, subcategorías y tickets.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => onSelect(null)}
                  className="text-primary hover:underline"
                >
                  Clientes
                </button>
                <ChevronRight size={12} className="text-black-25" />
                <button
                  onClick={() => {
                    setCategoria(null);
                    setSubcategoria(null);
                  }}
                  className={cn(
                    categoria ? "text-primary hover:underline" : "font-semibold text-black-85",
                  )}
                >
                  {selected.nombre}
                </button>
                {categoria && (
                  <>
                    <ChevronRight size={12} className="text-black-25" />
                    <button
                      onClick={() => setSubcategoria(null)}
                      className={cn(
                        subcategoria
                          ? "text-primary hover:underline"
                          : "font-semibold text-black-85",
                      )}
                    >
                      {categoria}
                    </button>
                  </>
                )}
                {subcategoria && (
                  <>
                    <ChevronRight size={12} className="text-black-25" />
                    <span className="font-semibold text-black-85">{subcategoria}</span>
                  </>
                )}
              </div>

              {selected.esNoIdentificado && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Grupo de atenciones sin identificación de cliente. No es un cliente confirmado y
                  no participa en rankings ni promedios.
                </div>
              )}

              {/* Categorías */}
              {!categoria && (
                <div className="max-h-[430px] overflow-auto">
                  {categoriasQuery.isLoading ? (
                    <p className="py-8 text-center text-sm text-black-25">Cargando categorías…</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
                          <th className="pb-2 pr-3">Categoría</th>
                          <th className="pb-2 pr-3 text-right">Atenciones</th>
                          <th className="pb-2 pr-3 text-right">% del cliente</th>
                          <th className="pb-2 pr-3 text-right">Tiempo prom.</th>
                          <th className="pb-2 text-right">Incumpl. SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(categoriasQuery.data?.categorias ?? []).map((c) => (
                          <tr
                            key={c.categoria}
                            onClick={() => setCategoria(c.categoria)}
                            className="cursor-pointer border-t border-black-5 hover:bg-black-5"
                          >
                            <td className="py-2 pr-3 text-xs font-medium text-black-85">
                              {c.categoria}
                            </td>
                            <td className="py-2 pr-3 text-right text-xs text-black-45">
                              {fmtNum(c.total)}
                            </td>
                            <td className="py-2 pr-3 text-right text-xs text-black-45">
                              {fmtPct1(c.pct)}
                            </td>
                            <td className="py-2 pr-3 text-right text-xs text-black-45">
                              {fmtDur(c.tiempoPromedio)}
                            </td>
                            <td className="py-2 text-right">
                              <SlaBadge
                                pctIncumple={c.pctIncumple}
                                noCumple={c.noCumple}
                                conDato={c.conDato}
                              />
                            </td>
                          </tr>
                        ))}
                        {(categoriasQuery.data?.categorias ?? []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-sm text-black-25">
                              Sin categorías para los filtros actuales.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Subcategorías */}
              {categoria && !subcategoria && (
                <div className="max-h-[430px] overflow-auto">
                  {subcategoriasQuery.isLoading ? (
                    <p className="py-8 text-center text-sm text-black-25">
                      Cargando subcategorías…
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
                          <th className="pb-2 pr-3">Subcategoría</th>
                          <th className="pb-2 pr-3 text-right">Atenciones</th>
                          <th className="pb-2 pr-3 text-right">% de la categoría</th>
                          <th className="pb-2 pr-3 text-right">Tiempo prom.</th>
                          <th className="pb-2 text-right">Incumpl. SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subcategoriasQuery.data?.subcategorias ?? []).map((s) => (
                          <tr
                            key={s.subcategoria}
                            onClick={() => setSubcategoria(s.subcategoria)}
                            className="cursor-pointer border-t border-black-5 hover:bg-black-5"
                          >
                            <td className="py-2 pr-3 text-xs font-medium text-black-85">
                              {s.subcategoria}
                            </td>
                            <td className="py-2 pr-3 text-right text-xs text-black-45">
                              {fmtNum(s.total)}
                            </td>
                            <td className="py-2 pr-3 text-right text-xs text-black-45">
                              {fmtPct1(s.pct)}
                            </td>
                            <td className="py-2 pr-3 text-right text-xs text-black-45">
                              {fmtDur(s.tiempoPromedio)}
                            </td>
                            <td className="py-2 text-right">
                              <SlaBadge
                                pctIncumple={s.pctIncumple}
                                noCumple={s.noCumple}
                                conDato={s.conDato}
                              />
                            </td>
                          </tr>
                        ))}
                        {(subcategoriasQuery.data?.subcategorias ?? []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-sm text-black-25">
                              Sin subcategorías para los filtros actuales.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tickets */}
              {categoria && subcategoria && (
                <div>
                  {ticketsQuery.isLoading ? (
                    <p className="py-8 text-center text-sm text-black-25">Cargando tickets…</p>
                  ) : (
                    <>
                      <div className="max-h-[430px] overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 z-10 bg-white">
                            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
                              <th className="pb-2 pr-2">Ticket</th>
                              <th className="pb-2 pr-2">Canal</th>
                              <th className="pb-2 pr-2">Fecha</th>
                              <th className="pb-2 pr-2">Categoría</th>
                              <th className="pb-2 pr-2">Subcategoría</th>
                              <th className="pb-2 pr-2">Dominio</th>
                              {selected.esNoIdentificado && (
                                <th className="pb-2 pr-2">Contacto</th>
                              )}
                              <th className="pb-2 pr-2">Asesor</th>
                              <th className="pb-2 pr-2">Estado</th>
                              <th className="pb-2 pr-2 text-right">Tiempo</th>
                              <th className="pb-2 text-right">SLA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ticketsQuery.data?.rows ?? []).map((t) => (
                              <tr key={t.ticket} className="border-t border-black-5">
                                <td className="py-2 pr-2 text-xs text-black-85">
                                  {t.urlTicket ? (
                                    <a
                                      href={t.urlTicket}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {t.ticket}
                                    </a>
                                  ) : (
                                    t.ticket
                                  )}
                                </td>
                                <td className="py-2 pr-2 text-xs text-black-45">
                                  {canalLabel(t.canal)}
                                </td>
                                <td className="whitespace-nowrap py-2 pr-2 text-xs text-black-45">
                                  {t.fecha}
                                </td>
                                <td className="py-2 pr-2 text-xs text-black-45">
                                  {t.categoria}
                                </td>
                                <td className="py-2 pr-2 text-xs text-black-45">
                                  {t.subcategoria}
                                </td>
                                <td className="max-w-[150px] truncate py-2 pr-2 text-xs text-black-45">
                                  {t.dominio}
                                </td>
                                {selected.esNoIdentificado && (
                                  <td className="max-w-[150px] truncate py-2 pr-2 text-xs text-black-45">
                                    {t.contacto ?? t.numero ?? "—"}
                                  </td>
                                )}
                                <td className="py-2 pr-2 text-xs text-black-45">{t.asesor}</td>
                                <td className="py-2 pr-2 text-xs text-black-45">
                                  {estadoLabel(t.estado)}
                                </td>
                                <td className="py-2 pr-2 text-right text-xs text-black-45">
                                  {fmtDur(t.tiempoResolucion)}
                                </td>
                                <td className="py-2 text-right">
                                  {t.cumpleSla == null ? (
                                    <span className="text-[10px] text-black-25">Sin dato</span>
                                  ) : (
                                    <Badge
                                      className={
                                        t.cumpleSla
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                          : "border-rose-200 bg-rose-50 text-rose-700"
                                      }
                                    >
                                      {t.cumpleSla ? "Cumple" : "No cumple"} ≤{" "}
                                      {fmtNum(t.umbralMinutos)} min
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {(ticketsQuery.data?.rows ?? []).length === 0 && (
                              <tr>
                                <td
                                  colSpan={selected.esNoIdentificado ? 11 : 10}
                                  className="py-8 text-center text-sm text-black-25"
                                >
                                  Sin tickets para los filtros actuales.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        page={ticketPage}
                        pageSize={PAGE_SIZE_TICKETS}
                        total={ticketsQuery.data?.total ?? 0}
                        onChange={setTicketPage}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Ranking                                                        */
/* ════════════════════════════════════════════════════════════════ */
function RankingTable({
  top,
  total,
  params,
  onSelect,
}: {
  top: ClienteResumen[];
  total: number;
  params: Record<string, string>;
  onSelect: (cliente: ClienteResumen) => void;
}) {
  const [verTodos, setVerTodos] = useState(false);
  const [page, setPage] = useState(1);

  const todosQuery = useQuery({
    queryKey: ["clientes-v2-ranking", params, page],
    queryFn: () =>
      fetchClientes({ ...params, page: String(page), pageSize: "20", search: "" }),
    enabled: verTodos,
    refetchOnWindowFocus: false,
  });

  const rows = verTodos ? todosQuery.data?.rows ?? [] : top;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-black-25">
          Porcentaje sobre las atenciones de clientes identificados, no sobre el Top 20.
        </p>
        <button
          onClick={() => {
            setVerTodos((v) => !v);
            setPage(1);
          }}
          className="rounded border border-black-10 px-2.5 py-1 text-xs text-black-45 hover:text-black-85"
        >
          {verTodos ? "Ver Top 20" : `Ver todos (${fmtNum(total)})`}
        </button>
      </div>

      <div className="max-h-[430px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-2">#</th>
              <th className="pb-2 pr-2">Cliente</th>
              <th className="pb-2 pr-2 text-right">Atenciones</th>
              <th className="pb-2 pr-2 text-right">% del total</th>
              <th className="pb-2 pr-2 text-right">Variación</th>
              <th className="pb-2 pr-2 text-right">Tiempo prom.</th>
              <th className="pb-2 pr-2 text-right">Incumpl. SLA</th>
              <th className="pb-2">Canales</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.clave}
                onClick={() => onSelect(r)}
                className="cursor-pointer border-t border-black-5 hover:bg-black-5"
              >
                <td className="py-2 pr-2 text-xs text-black-25">
                  {(verTodos ? (page - 1) * 20 : 0) + i + 1}
                </td>
                <td className="max-w-[230px] truncate py-2 pr-2 text-xs font-medium text-black-85">
                  {r.cliente}
                </td>
                <td className="py-2 pr-2 text-right text-xs text-black-85">
                  {fmtNum(r.total)}
                </td>
                <td className="py-2 pr-2 text-right text-xs text-black-45">
                  {fmtPct1(r.pct)}
                </td>
                <td className={cn("py-2 pr-2 text-right text-xs", variacionClass(r.variacionPct))}>
                  {r.variacionPct == null
                    ? "—"
                    : `${r.variacionPct > 0 ? "+" : ""}${fmt1(r.variacionPct)}%`}
                </td>
                <td className="py-2 pr-2 text-right text-xs text-black-45">
                  {fmtDur(r.tiempoPromedio)}
                </td>
                <td className="py-2 pr-2 text-right">
                  <SlaBadge pctIncumple={r.pctIncumple} noCumple={r.noCumple} conDato={r.conDato} />
                </td>
                <td className="py-2 text-xs text-black-45">
                  {r.canales.map(canalNombre).join(" · ") || "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-black-25">
                  Sin clientes para los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {verTodos && (
        <Pagination
          page={page}
          pageSize={20}
          total={todosQuery.data?.total ?? 0}
          onChange={setPage}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Mezcla de canales                                              */
/* ════════════════════════════════════════════════════════════════ */
function MezclaCanales({ data }: { data: ClientesV2Response["canales"] }) {
  const total = data.total || 1;
  const partes = [
    { label: "Solo WhatsApp", value: data.soloWhatsapp, color: CHART.brand },
    { label: "Solo correo", value: data.soloCorreo, color: CHART.primary },
    { label: "Ambos", value: data.ambos, color: CHART.success },
  ];
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-black-5">
        {partes.map((p) => (
          <div
            key={p.label}
            style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }}
            title={`${p.label}: ${fmtNum(p.value)} (${fmtPct1((p.value / total) * 100)})`}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {partes.map((p) => (
          <li key={p.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-black-45">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.label}
            </span>
            <span className="text-black-85">
              {fmtNum(p.value)}
              <span className="ml-1 text-black-25">{fmtPct1((p.value / total) * 100)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-black-25">
        Un cliente puede usar ambos canales. Por eso se muestra la mezcla y no una suma de canales.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Evolución                                                      */
/* ════════════════════════════════════════════════════════════════ */
function Evolucion({
  params,
  cliente,
}: {
  params: Record<string, string>;
  cliente: { clave: string; nombre: string; esNoIdentificado: boolean } | null;
}) {
  const [granularidad, setGranularidad] = useState<Granularidad>("semanal");

  const { data, isLoading } = useQuery({
    queryKey: ["clientes-v2-evolucion", params, cliente?.clave, granularidad],
    queryFn: () =>
      fetchEvolucion({
        ...params,
        clave: cliente!.clave,
        granularidad,
      }),
    enabled: !!cliente,
    refetchOnWindowFocus: false,
  });

  const option = useMemo<EChartsOption>(() => {
    const actual = data?.actual ?? [];
    const anterior = data?.anterior ?? [];
    return {
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 46, right: 16, top: 16, bottom: 54 },
      xAxis: {
        type: "category",
        data: actual.map((p) => p.periodo),
        axisLabel: { fontSize: 10, rotate: actual.length > 12 ? 35 : 0 },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Atenciones",
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { type: "dashed" } },
      },
      series: [
        {
          name: "Actual",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color: CHART.brand, width: 3 },
          itemStyle: { color: CHART.brand },
          areaStyle: { color: "rgba(249,115,22,0.10)" },
          data: actual.map((p) => p.total),
        },
        {
          name: "Periodo anterior",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color: CHART.muted, width: 2, type: "dashed" },
          itemStyle: { color: CHART.muted },
          data: actual.map((_, i) => anterior[i]?.total ?? null),
        },
      ],
    };
  }, [data]);

  if (!cliente) {
    return (
      <p className="py-10 text-center text-sm text-black-25">
        Selecciona un cliente en el explorador para ver su evolución.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-black-25">
          {cliente.nombre}
          {data && (
            <span className="ml-2">
              Actual: <b className="text-black-85">{fmtNum(data.totalActual)}</b> · Anterior:{" "}
              <b className="text-black-85">{fmtNum(data.totalAnterior)}</b>
              {data.variacionPct != null && (
                <span className={cn("ml-1", variacionClass(data.variacionPct))}>
                  ({data.variacionPct > 0 ? "+" : ""}
                  {fmt1(data.variacionPct)}%)
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border border-black-10 bg-black-5 p-1">
          {(["diaria", "semanal", "mensual"] as Granularidad[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularidad(g)}
              className={cn(
                "rounded px-2 py-1 text-[11px] font-medium",
                granularidad === g ? "bg-primary text-white" : "text-black-45",
              )}
            >
              {g === "diaria" ? "Diaria" : g === "semanal" ? "Semanal" : "Mensual"}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-black-25">Cargando evolución…</p>
      ) : (data?.actual.length ?? 0) <= 1 ? (
        <p className="py-10 text-center text-sm text-black-25">
          Se requieren al menos 2 periodos para mostrar la evolución.
        </p>
      ) : (
        <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ════════════════════════════════════════════════════════════════ */
export default function Clientes() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);
  const [exportando, setExportando] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<{
    clave: string;
    nombre: string;
    esNoIdentificado: boolean;
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clientes-v2", params],
    queryFn: () => fetchSummary(params),
    refetchOnWindowFocus: false,
  });

  const exportar = useCallback(
    async (nivel: NivelExportacion, extra?: Record<string, string>) => {
      setExportando(true);
      try {
        const res = await api.get("/dashboard/clientes-v2/exportar", {
          params: { ...params, nivel, ...(extra ?? {}) },
          responseType: "blob",
        });
        const disposition = (res.headers["content-disposition"] as string) ?? "";
        const nombre = disposition.match(/filename="(.+)"/)?.[1] ?? `Clientes_${nivel}`;
        const blob = new Blob([res.data as BlobPart], {
          type: (res.headers["content-type"] as string) ?? "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        console.error("No se pudo exportar el nivel seleccionado");
      } finally {
        setExportando(false);
      }
    },
    [params],
  );

  const seleccionarCliente = useCallback((cliente: ClienteResumen | ClienteSeguimiento) => {
    setSelectedCliente({
      clave: cliente.clave,
      nombre: cliente.cliente,
      esNoIdentificado: false,
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center"
      >
        <p className="text-sm text-black-25">
          No se pudieron cargar los datos. Revisa que el backend esté encendido y conectado.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">Análisis de Clientes</h1>
          <p className="mt-1 text-sm text-muted">
            Comportamiento de clientes sobre atenciones finalizadas. Cliente → Categoría →
            Subcategoría → Tickets.
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            {fmtNum(data.universo.total)} atenciones finalizadas
          </span>
          <p className="mt-1">
            {fmtNum(data.kpis.clientesIdentificados)} clientes identificados ·{" "}
            {fmtNum(data.kpis.atencionesNoIdentificadas)} no identificadas
          </p>
          {data.universo.rango && (
            <p className="mt-0.5">
              Comparando {data.universo.rango.inicio.slice(0, 10)} →{" "}
              {data.universo.rango.fin.slice(0, 10)} contra{" "}
              {data.universo.rango.comparadoCon.inicio} →{" "}
              {data.universo.rango.comparadoCon.fin}
            </p>
          )}
        </div>
      </div>

      <Kpis data={data} />
      <CalidadFranja data={data} />

      <Section
        title="Clientes que requieren seguimiento"
        subtitle="Señales objetivas y explicables. No es un score ni una clasificación de riesgo comercial."
      >
        <SeguimientoTable items={data.seguimiento} onSelect={seleccionarCliente} />
      </Section>

      <Section
        title="Explorador de clientes"
        subtitle="Navega hasta el ticket individual. El grupo no identificado está separado de los clientes confirmados."
      >
        <Explorador
          params={params}
          summary={data}
          exportando={exportando}
          onExport={exportar}
          selected={selectedCliente}
          onSelect={setSelectedCliente}
        />
      </Section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Section
          title="Ranking de clientes por demanda"
          subtitle="Top 20 por atenciones. La tabla no es un ranking de riesgo."
        >
          <RankingTable
            top={data.ranking}
            total={data.rankingTotal}
            params={params}
            onSelect={seleccionarCliente}
          />
        </Section>

        <Section
          title="Mezcla de canales"
          subtitle="Clientes identificados según el canal o canales que usan."
        >
          <MezclaCanales data={data.canales} />
        </Section>
      </div>

      <Section
        title="Evolución del cliente seleccionado"
        subtitle="Atenciones actuales contra el periodo anterior equivalente."
      >
        <Evolucion params={params} cliente={selectedCliente} />
      </Section>

      <div className="rounded-xl border border-border bg-bg px-4 py-3 text-[11px] text-muted">
        Universo: atenciones con estado homologado <b>cerrado</b> o <b>resuelto</b>, con fecha real
        de creación (Zendesk UTC → America/Lima; WhatsApp local). Las atenciones sin cliente
        identificado permanecen en el total, pero no se cuentan como clientes ni entran en rankings,
        promedios o seguimiento. No se modifican otros reportes.
      </div>
    </motion.div>
  );
}
