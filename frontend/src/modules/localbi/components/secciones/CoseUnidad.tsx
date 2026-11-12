import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { useActividadCose } from "../../hooks/useHistoriaClinica";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import type { CoseAtencion, CoseIndicadorTiempo, CoseOpciones } from "../../types/localbi";
import { SeccionColapsable, useHistoriaDensity } from "../HistoriaClinicaUI";
import { normalizeDomain } from "@/domain/normalizacion";
import { cn } from "@/lib/utils";

/**
 * COSE — historial operativo de atenciones del cliente.
 *
 * - Universo: v_unificado_norm (lista blanca de 19 asesores).
 * - Deduplicado por (canal, ticket_id) en backend.
 * - Período, filtros y agregados calculados en SQL.
 * - El número abre el registro de Zendesk solo para CORREO/ZENDESK.
 * - WhatsApp no se enlaza: sus IDs pueden colisionar con IDs de Zendesk.
 */

const PERIODOS: [string, string][] = [
  ["7", "7d"],
  ["30", "30d"],
  ["90", "90d"],
  ["todo", "Todo"],
];

const TODO_DESDE = "2000-01-01";

function fechaLimaHoy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function restarDias(ymd: string, dias: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - dias);
  return dt.toISOString().slice(0, 10);
}

function rangoPeriodo(periodo: string): { desde: string; hasta: string } {
  const hasta = fechaLimaHoy();
  if (periodo === "todo") return { desde: TODO_DESDE, hasta };
  const dias = Number(periodo) || 30;
  return { desde: restarDias(hasta, dias - 1), hasta };
}

function periodLabel(periodo: string): string {
  if (periodo === "todo") return "Todo el historial";
  return `Últimos ${periodo} días`;
}

function valor(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s && s !== "-" ? s : null;
}

function fmtFechaHora(a: CoseAtencion): string {
  // `fecha` es date-only y `hora` es la hora local de la vista (Lima).
  // No se usa `tickets_created_at` para mostrar: es timestamp without time zone
  // y su serialización por el driver puede desplazar la hora.
  const ymd = (a.fecha ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "No disponible";
  const [y, m, d] = ymd.split("-").map(Number);
  const hm = (a.hora ?? "").match(/^(\d{1,2}):(\d{2})/);
  const hh = hm ? Number(hm[1]) : 0;
  const mm = hm ? Number(hm[2]) : 0;
  const fecha = new Date(Date.UTC(y, m - 1, d));
  const fechaTxt = fecha.toLocaleDateString("es-PE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!hm) return fechaTxt;
  const horaTxt = new Date(Date.UTC(2000, 0, 1, hh, mm)).toLocaleTimeString("es-PE", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fechaTxt}, ${horaTxt}`;
}

function fmtMinutos(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "No disponible";
  const total = Math.round(v);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d} d ${hr} h` : `${d} d`;
}

function coberturaTexto(i: CoseIndicadorTiempo, total: number): string {
  if (!total) return "—";
  const pct = Math.round((i.n / total) * 100);
  return `${i.n}/${total} · ${pct}%`;
}

function estadoLabel(estado: string | null | undefined): string {
  if (!estado) return "Sin estado";
  const map: Record<string, string> = {
    cerrado: "Cerrado",
    resuelto: "Resuelto",
    abierto: "Abierto",
    sin_mapear: "Sin mapear",
  };
  return map[estado] ?? estado.charAt(0).toUpperCase() + estado.slice(1);
}

function tonoEstado(estado: string | null | undefined): string {
  if (estado === "resuelto") return "bg-success-5 text-success";
  if (estado === "abierto") return "bg-primary-5 text-primary";
  if (estado === "sin_mapear") return "bg-warning-5 text-warning-65";
  if (estado === "cerrado") return "bg-black-5 text-black-65";
  return "bg-black-5 text-black-45";
}

export function CoseUnidad({ data }: { data: HistoriaClinicaData }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const dominios = useMemo(
    () => (data.ficha?.dominios ?? []).map((d) => d.dominio).filter(Boolean),
    [data.ficha],
  );
  const locales = data.locales;
  const localesMap = useMemo(
    () => new Map(locales.map((l) => [l.localbi_id, l.nombre])),
    [locales],
  );

  const [periodo, setPeriodo] = useState("30");
  const [local, setLocal] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [asesor, setAsesor] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const rango = rangoPeriodo(periodo);

  const params = {
    desde: rango.desde,
    hasta: rango.hasta,
    limite: 200,
    localbi_id: local !== "todos" ? local : undefined,
    canal: canal !== "todos" ? canal : undefined,
    asesor: asesor !== "todos" ? asesor : undefined,
    estado: estado !== "todos" ? estado : undefined,
    q: busqueda.trim() || undefined,
  };

  const { data: cose, isLoading, isError, refetch } = useActividadCose(dominios, params);
  const resumen = cose?.resumen;
  const opciones: CoseOpciones | undefined = cose?.opciones;
  const atenciones = cose?.ultimasAtenciones ?? [];

  const nombreLocal = (id: string | null | undefined) =>
    id ? localesMap.get(id) ?? id : "Sin local asignado";

  const hayFiltros =
    local !== "todos" || canal !== "todos" || asesor !== "todos" || estado !== "todos" || busqueda.trim() !== "";

  const limpiar = () => {
    setLocal("todos");
    setCanal("todos");
    setAsesor("todos");
    setEstado("todos");
    setBusqueda("");
  };

  const filtrosTexto = [
    local !== "todos" ? `Local: ${nombreLocal(local)}` : null,
    canal !== "todos" ? `Canal: ${canal}` : null,
    asesor !== "todos" ? `Asesor: ${asesor}` : null,
    estado !== "todos" ? `Estado: ${estadoLabel(estado)}` : null,
    busqueda.trim() ? `Búsqueda: ${busqueda.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const estadoOptions = opciones?.estados ?? [];
  const canalOptions = opciones?.canales ?? [];
  const asesorOptions = opciones?.asesores ?? [];
  const localOptions = opciones?.locales ?? [];
  // Chips: conteos del universo filtrado, ignorando la dimensión del chip.
  const estadoChips = cose?.chips?.estados ?? [];
  const sinLocal = cose?.chips?.sin_local ?? 0;

  return (
    <SeccionColapsable
      title="COSE"
      badge={
        resumen ? (
          <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
            {resumen.total}
          </span>
        ) : undefined
      }
    >
      {dominios.length === 0 ? (
        <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
          Sin dominios asociados.
        </p>
      ) : (
        <div className={comfortable ? "space-y-3" : "space-y-2"}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("uppercase tracking-wider text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
              Período:
            </span>
            {PERIODOS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setPeriodo(v)}
                className={cn(
                  "rounded-md font-medium",
                  comfortable ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[9px]",
                  periodo === v ? "bg-primary text-white" : "bg-black-5 text-black-65 hover:bg-black-10",
                )}
              >
                {label}
              </button>
            ))}
            <span className={cn("text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
              {periodo === "todo" ? "Historial completo" : `${rango.desde} → ${rango.hasta}`}
            </span>
          </div>

          {isLoading ? (
            <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
              Cargando COSE…
            </p>
          ) : isError ? (
            <div className={comfortable ? "text-[13px] text-black-45" : "text-[9px] text-black-25"}>
              <p>No se pudo cargar COSE.</p>
              <button type="button" onClick={() => refetch()} className="mt-1 font-medium text-primary hover:underline">
                Reintentar
              </button>
            </div>
          ) : !resumen ? (
            <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
              Sin datos de COSE.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                {estadoChips.map((e) => (
                  <button
                    key={e.nombre}
                    type="button"
                    onClick={() => setEstado((prev) => (prev === e.nombre ? "todos" : e.nombre))}
                    className={cn(
                      "inline-flex items-center rounded-md font-medium",
                      comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
                      tonoEstado(e.nombre),
                      estado === e.nombre && "ring-2 ring-primary-25",
                    )}
                  >
                    {estadoLabel(e.nombre)} · {e.cantidad}
                  </button>
                ))}
                {sinLocal > 0 && (
                  <button
                    type="button"
                    onClick={() => setLocal((prev) => (prev === "__sin_local__" ? "todos" : "__sin_local__"))}
                    className={cn(
                      "inline-flex items-center rounded-md font-medium",
                      comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
                      "bg-warning-5 text-warning-65",
                      local === "__sin_local__" && "ring-2 ring-primary-25",
                    )}
                  >
                    Sin local asignado · {sinLocal}
                  </button>
                )}
              </div>

              <div className={cn("grid grid-cols-2 gap-1.5", comfortable ? "sm:grid-cols-3" : "sm:grid-cols-3")}>
                <KpiCose label="Total" value={String(resumen.total)} />
                <KpiCose
                  label="Primera respuesta"
                  value={
                    <span>
                      {fmtMinutos(resumen.primera_respuesta.promedio)}
                      <span className="ml-1 text-[11px] font-normal text-black-45">
                        prom.
                      </span>
                    </span>
                  }
                  sub={
                    <span>
                      Mediana: {fmtMinutos(resumen.primera_respuesta.mediana)} ·{" "}
                      {coberturaTexto(resumen.primera_respuesta, resumen.total)}
                    </span>
                  }
                />
                <KpiCose
                  label="Tiempo de resolución"
                  value={
                    <span>
                      {fmtMinutos(resumen.resolucion.promedio)}
                      <span className="ml-1 text-[11px] font-normal text-black-45">
                        prom.
                      </span>
                    </span>
                  }
                  sub={
                    <span>
                      Mediana: {fmtMinutos(resumen.resolucion.mediana)} ·{" "}
                      {coberturaTexto(resumen.resolucion, resumen.total)}
                    </span>
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <Search
                    size={comfortable ? 14 : 11}
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45"
                  />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por #atención, contacto o dominio"
                    aria-label="Buscar atenciones por número, contacto o dominio"
                    className={cn(
                      "max-w-full rounded-md border border-black-10 bg-white pl-7 pr-2 text-black-85 outline-none placeholder:text-black-25 focus:border-primary-25",
                      comfortable ? "h-8 w-64 text-[12px]" : "h-6 w-52 text-[9px]",
                    )}
                  />
                </label>

                <SelectFiltro
                  label="Local"
                  value={local}
                  onChange={setLocal}
                  options={[
                    { value: "todos", label: "Todos los locales" },
                    ...localOptions.map((l) => ({
                      value: l.localbi_id ?? "__sin_local__",
                      label: nombreLocal(l.localbi_id),
                    })),
                  ]}
                />
                <SelectFiltro
                  label="Canal"
                  value={canal}
                  onChange={setCanal}
                  options={[
                    { value: "todos", label: "Todos los canales" },
                    ...canalOptions.map((c) => ({ value: c.nombre, label: c.nombre })),
                  ]}
                />
                <SelectFiltro
                  label="Asesor"
                  value={asesor}
                  onChange={setAsesor}
                  options={[
                    { value: "todos", label: "Todos los asesores" },
                    ...asesorOptions.map((a) => ({ value: a.nombre, label: a.nombre })),
                  ]}
                />
                <SelectFiltro
                  label="Estado"
                  value={estado}
                  onChange={setEstado}
                  options={[
                    { value: "todos", label: "Todos los estados" },
                    ...estadoOptions.map((e) => ({ value: e.nombre, label: estadoLabel(e.nombre) })),
                  ]}
                />

                {hayFiltros && (
                  <button
                    type="button"
                    onClick={limpiar}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border border-black-10 text-black-65 hover:bg-light",
                      comfortable ? "h-8 px-2.5 text-[12px]" : "h-6 px-2 text-[9px]",
                    )}
                  >
                    <X size={comfortable ? 12 : 9} /> Limpiar
                  </button>
                )}
              </div>

              <p className={cn("text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
                Universo: <span className="font-medium text-black-65">{periodLabel(periodo)}</span>
                {filtrosTexto ? <> · {filtrosTexto}</> : null}
                {resumen.duplicados > 0 && (
                  <span
                    title="Registros repetidos del período y dominio consolidados en una sola atención (independiente de los filtros)."
                    className="ml-1 text-black-25"
                  >
                    {" "}· {resumen.duplicados} {resumen.duplicados === 1 ? "duplicado consolidado" : "duplicados consolidados"} en el período
                  </span>
                )}
              </p>
              <p className={cn("text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
                Mostrando <span className="font-medium text-black-65">{atenciones.length}</span> de{" "}
                <span className="font-medium text-black-65">{resumen.total}</span> atenciones
                {atenciones.length < resumen.total && (
                  <span className="ml-1 text-black-25">(listado limitado a 200; los KPIs usan todo el universo)</span>
                )}
              </p>

              {atenciones.length === 0 ? (
                <p className={comfortable ? "text-[13px] text-black-45" : "text-[9px] text-black-25"}>
                  No hay atenciones que coincidan con los filtros.
                </p>
              ) : (
                <div className={comfortable ? "space-y-2.5" : "space-y-1"}>
                  {atenciones.map((a) => (
                    <CoseAtencionCard
                      key={`${a.canal}-${a.ticket_id}`}
                      atencion={a}
                      localNombre={nombreLocal(a.localbi_id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </SeccionColapsable>
  );
}

function KpiCose({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div
      className={cn(
        "rounded-lg border border-black-10",
        comfortable ? "bg-white px-3 py-2.5" : "bg-light px-2 py-1.5",
      )}
    >
      <p className={cn("leading-tight text-black-85", comfortable ? "text-[20px] font-bold" : "text-sm font-semibold")}>
        {value}
      </p>
      <p className={cn(comfortable ? "mt-1 text-[12px] text-black-65" : "mt-0.5 text-[9px] text-black-45")}>{label}</p>
      {sub && (
        <p className={cn(comfortable ? "mt-0.5 text-[11px] text-black-45" : "text-[8px] text-black-25")}>{sub}</p>
      )}
    </div>
  );
}

function SelectFiltro({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <label className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      <span className={cn("shrink-0", comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45")}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-w-0 max-w-full rounded-md border border-black-10 bg-white text-black-85 outline-none focus:border-primary-25",
          comfortable ? "h-8 px-2 text-[12px]" : "h-6 px-1.5 text-[9px]",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CoseAtencionCard({ atencion, localNombre }: { atencion: CoseAtencion; localNombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const comfortable = useHistoriaDensity() === "comfortable";
  const esZendesk = atencion.canal === "CORREO" && atencion.subcanal === "ZENDESK";
  const href = `/atenciones?ticket=${encodeURIComponent(atencion.ticket_id)}&canal=CORREO`;
  const dominio = normalizeDomain(atencion.dominio) ?? valor(atencion.dominio);

  return (
    <div
      className={cn(
        "min-w-0 max-w-full rounded-lg border border-black-10",
        comfortable ? "bg-white p-4" : "bg-light p-2",
      )}
    >
      <div className="flex min-w-0 max-w-full flex-col gap-2">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          {esZendesk ? (
            <Link
              to={href}
              title="Abrir la atención original en Zendesk"
              className={cn(
                "inline-flex max-w-full shrink-0 items-center gap-1 font-mono font-semibold text-primary hover:underline",
                comfortable ? "text-[15px]" : "text-[10px]",
              )}
            >
              #{atencion.ticket_id}
              <ExternalLink size={comfortable ? 13 : 10} aria-hidden />
            </Link>
          ) : (
            <span
              title="Enlace no disponible para WhatsApp: sus IDs pueden coincidir con IDs de Zendesk"
              className={cn(
                "max-w-full shrink-0 font-mono font-semibold text-black-45",
                comfortable ? "text-[15px]" : "text-[10px]",
              )}
            >
              #{atencion.ticket_id}
            </span>
          )}

          <EstadoBadge estado={atencion.estado_homologado ?? atencion.estado} />

          <span
            className={cn(
              "rounded-md bg-black-5 px-2 py-0.5 text-black-65",
              comfortable ? "text-[11px]" : "text-[8px]",
            )}
          >
            {atencion.canal ?? "Sin canal"}
            {atencion.subcanal ? ` · ${atencion.subcanal}` : ""}
          </span>

          <span
            className={cn(
              "max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-black-65",
              comfortable ? "text-[12px]" : "text-[9px]",
            )}
          >
            {localNombre}
          </span>

          {dominio && (
            <span
              className={cn(
                "max-w-full whitespace-normal break-words [overflow-wrap:anywhere] font-mono text-primary",
                comfortable ? "text-[12px]" : "text-[9px]",
              )}
            >
              {dominio}
            </span>
          )}
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center text-black-65",
            comfortable ? "gap-x-3 gap-y-1 text-[13px]" : "gap-x-2 gap-y-0.5 text-[9px]",
          )}
        >
          <span className="shrink-0 tabular-nums">{fmtFechaHora(atencion)}</span>
          {valor(atencion.categoria) && (
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{atencion.categoria}</span>
          )}
          {valor(atencion.subcategoria) && (
            <span className="min-w-0 break-words [overflow-wrap:anywhere] text-black-45">
              · {atencion.subcategoria}
            </span>
          )}
          {valor(atencion.asesor) && <span className="shrink-0">· {atencion.asesor}</span>}
        </div>

        <div
          className={cn(
            "grid min-w-0 max-w-full gap-x-6 gap-y-1 md:grid-cols-2",
            comfortable ? "text-[13px]" : "text-[9px]",
          )}
        >
          <Dato label="Primera respuesta" value={fmtMinutos(atencion.primera_respuesta_min_norm)} />
          <Dato label="Tiempo de resolución" value={fmtMinutos(atencion.resolucion_min_norm)} />
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className={cn(
            "inline-flex max-w-full items-center gap-1 font-medium text-primary hover:underline",
            comfortable ? "text-[13px]" : "text-[9px]",
          )}
        >
          {abierto ? <ChevronDown size={comfortable ? 14 : 10} /> : <ChevronRight size={comfortable ? 14 : 10} />}
          {abierto ? "Ocultar detalle" : "Ver detalle completo"}
        </button>
      </div>

      {abierto && <CoseAtencionDetalle atencion={atencion} localNombre={localNombre} esZendesk={esZendesk} href={href} />}
    </div>
  );
}

function CoseAtencionDetalle({
  atencion,
  localNombre,
  esZendesk,
  href,
}: {
  atencion: CoseAtencion;
  localNombre: string;
  esZendesk: boolean;
  href: string;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const medioLabel = atencion.canal === "WHATSAPP" ? "Teléfono" : "Correo";
  const comentario = valor(atencion.comentario_cierre);

  return (
    <div className={cn("border-t border-black-10", comfortable ? "mt-3 space-y-3 pt-3" : "mt-2 space-y-2 pt-2")}>
      <div
        className={cn(
          "grid min-w-0 max-w-full gap-x-6 gap-y-1.5 md:grid-cols-2",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        <Dato
          label="Identificador original"
          value={
            esZendesk ? (
              <Link to={href} className="text-primary hover:underline" title="Abrir en Zendesk">
                #{atencion.ticket_id}
              </Link>
            ) : (
              <span className="font-mono">#{atencion.ticket_id}</span>
            )
          }
        />
        <Dato label="Contacto" value={valor(atencion.contacto) ?? "No disponible"} />
        <Dato label={medioLabel} value={valor(atencion.numero) ?? "No disponible"} />
        <Dato label="Dominio" value={normalizeDomain(atencion.dominio) ?? "No disponible"} />
        <Dato label="Local" value={localNombre} />
        <Dato
          label="Canal"
          value={[atencion.canal, atencion.subcanal].filter(Boolean).join(" · ") || "No disponible"}
        />
        <Dato label="Categoría" value={valor(atencion.categoria) ?? "No disponible"} />
        <Dato label="Subcategoría" value={valor(atencion.subcategoria) ?? "No disponible"} />
        <Dato label="Asesor" value={valor(atencion.asesor) ?? "No disponible"} />
        <Dato label="Estado" value={<EstadoBadge estado={atencion.estado_homologado ?? atencion.estado} />} />
        <Dato label="Primera respuesta" value={fmtMinutos(atencion.primera_respuesta_min_norm)} />
        <Dato label="Tiempo de resolución" value={fmtMinutos(atencion.resolucion_min_norm)} />
        {valor(atencion.rango_atencion) && (
          <Dato label="Rango de atención" value={atencion.rango_atencion} />
        )}
      </div>

      {comentario && (
        <div className="min-w-0 max-w-full">
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Comentario de cierre
          </p>
          <p
            className={cn(
              "mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-black-65",
              comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
            )}
          >
            {comentario}
          </p>
        </div>
      )}

      {!esZendesk && (
        <p className={cn("text-black-45", comfortable ? "text-[11px]" : "text-[8px] text-black-25")}>
          Atención de WhatsApp: sin enlace al detalle original hasta contar con un identificador
          inequívoco del proveedor.
        </p>
      )}
    </div>
  );
}

function Dato({
  label,
  value,
  tono,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  tono?: "muted";
  mono?: boolean;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-0.5 md:flex-row md:items-start md:justify-between md:gap-3">
      <span className={cn("shrink-0", comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25")}>
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-left font-medium",
          mono && "font-mono",
          tono === "muted" ? "text-black-45" : "text-black-85",
          comfortable ? "text-[13px]" : "text-[9px]",
          "md:text-right",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string | null | undefined }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  if (!estado) return <span className="text-black-10">—</span>;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        tonoEstado(estado),
      )}
    >
      {estadoLabel(estado)}
    </span>
  );
}
