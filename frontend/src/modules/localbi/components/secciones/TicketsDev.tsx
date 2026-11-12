import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { useTareabiLogs, useTareabiLogsMulti } from "@/modules/tareabi";
import type { TareabiHistorialEntrada } from "@/modules/tareabi";
import type { LocalbiTarea, LocalbiTicket } from "../../types/localbi";
import { SeccionColapsable } from "../HistoriaClinicaUI";
import { config } from "@/config/env";
import { cn } from "@/lib/utils";
import {
  fmtDuracion,
  fmtFechaHora,
  parseFechaLocal,
  textoValido,
  tieneHora,
  tonoEstadoTarea,
} from "../../utils/tareasFechas";

/**
 * TICKETS DEV — tickets de desarrollo (LocalBI → Tareabi).
 *
 * No son atenciones de COPE ni incidencias de Soporte en Línea.
 * - Ticket: datos de LocalBI (estado, fechas, área, tareas).
 * - Tarea: detalle + historial de Tareabi bajo demanda.
 * - Enlace externo: ruta oficial verificada de Tareabi por `tareabi_id`.
 *
 * Reglas:
 * - El estado del ticket es el propio (`ticket.estado`); el estado de una
 *   tarea solo se muestra dentro de su tarea.
 * - Desarrollador y área responsable son datos distintos.
 * - No se inventan fechas, referencias, responsables ni estados.
 * - Los textos largos envuelven; no se usa `truncate` ni `nowrap`.
 */

const BASE_TAREABI = config.tareabiApiUrl.replace(/\/+$/, "");

type TicketsDensity = "compact" | "comfortable";

const DensityContext = createContext<TicketsDensity>("comfortable");
function useDensity(): TicketsDensity {
  return useContext(DensityContext);
}

const parseFecha = parseFechaLocal;
const valor = textoValido;
const tonoEstado = tonoEstadoTarea;

/** Estados finales propios del ticket (no de la tarea). */
function esTerminal(estado: string | null | undefined): boolean {
  return /complet|rechaz|cerrad|resuelt|cancel/i.test(estado ?? "");
}

/**
 * Referencia verificada. No se clasifica cualquier texto corto como
 * referencia: se aceptan URLs o códigos con dígitos y sin espacios.
 * Ante ambigüedad, el texto se conserva como título.
 */
function referenciaVerificada(v: string | null | undefined): string | null {
  const s = valor(v);
  if (!s) return null;
  if (/^https?:\/\/\S+$/i.test(s)) return s;
  if (/^[A-Za-z0-9._/-]{1,40}$/.test(s) && /\d/.test(s)) return s;
  return null;
}

interface TextosTicket {
  titulo: string | null;
  resto: string | null;
  descripcion: string | null;
}

/** Separa título y descripción sin duplicar el mismo contenido. */
function textosDeTicket(ticket: LocalbiTicket, referencia: string | null): TextosTicket {
  const tareas = ticket.tareas ?? [];
  const descripcionTarea = tareas.map((t) => valor(t.detalle)).find((v): v is string => Boolean(v)) ?? null;
  const tituloFuente = referencia
    ? descripcionTarea
    : valor(ticket.titulo) ?? descripcionTarea;
  const lineas = tituloFuente
    ? tituloFuente.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
    : [];
  const titulo = lineas[0] ?? null;
  const resto = lineas.length > 1 ? lineas.slice(1).join("\n") : null;
  const descripcion = descripcionTarea ?? (!referencia ? valor(ticket.titulo) : null);
  return { titulo, resto, descripcion };
}

function desarrolladoresDe(ticket: LocalbiTicket): string[] {
  return [
    ...new Set(
      (ticket.tareas ?? [])
        .map((t) => valor(t.responsable))
        .filter((v): v is string => Boolean(v)),
    ),
  ];
}

function claveEstado(ticket: LocalbiTicket): string {
  return valor(ticket.estado) ?? "__sin_estado__";
}

function claveArea(ticket: LocalbiTicket): string {
  return valor(ticket.area_responsable) ?? "__sin_area__";
}

function claveDesarrollador(ticket: LocalbiTicket): string[] {
  const devs = desarrolladoresDe(ticket);
  return devs.length ? devs : ["__sin_desarrollador__"];
}

function etiquetaEstado(v: string): string {
  return v === "__sin_estado__" ? "Sin estado" : v;
}

function etiquetaArea(v: string): string {
  return v === "__sin_area__" ? "Sin área" : v;
}

function etiquetaDesarrollador(v: string): string {
  return v === "__sin_desarrollador__" ? "Sin asignar" : v;
}

function valoresUnicos(valores: string[], etiqueta: (v: string) => string): string[] {
  return [...new Set(valores)].sort((a, b) => etiqueta(a).localeCompare(etiqueta(b), "es"));
}

interface TiempoTicket {
  kind: "duracion" | "transcurrido" | "inconsistente" | "sin_datos";
  ms?: number;
  sinHora?: boolean;
}

/** Tiempo del ticket: `fecha_solucion` solo se usa si tiene sentido. */
function resolverTiempoTicket(ticket: LocalbiTicket, ahora: number): TiempoTicket {
  const creado = parseFecha(ticket.fecha_creacion);
  const fin = parseFecha(ticket.fecha_solucion);
  const terminal = esTerminal(ticket.estado);

  if (creado && fin) {
    if (fin.getTime() < creado.getTime()) return { kind: "inconsistente" };
    if (terminal) {
      return {
        kind: "duracion",
        ms: fin.getTime() - creado.getTime(),
        sinHora: !tieneHora(ticket.fecha_creacion) && !tieneHora(ticket.fecha_solucion),
      };
    }
    return { kind: "transcurrido", ms: Math.max(0, ahora - creado.getTime()) };
  }

  if (!creado) return { kind: "sin_datos" };
  if (terminal) return { kind: "sin_datos" };
  return { kind: "transcurrido", ms: Math.max(0, ahora - creado.getTime()) };
}

/** Refresca el tiempo transcurrido mientras la ficha está abierta. */
function useAhora(activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [activo]);
  return ahora;
}

export function TicketsDev({
  tickets,
  density = "comfortable",
}: {
  tickets: LocalbiTicket[];
  density?: TicketsDensity;
}) {
  return (
    <DensityContext.Provider value={density}>
      <TicketsDevContenido tickets={tickets} />
    </DensityContext.Provider>
  );
}

function TicketsDevContenido({ tickets }: { tickets: LocalbiTicket[] }) {
  const comfortable = useDensity() === "comfortable";
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [desarrollador, setDesarrollador] = useState("todos");
  const [area, setArea] = useState("todos");

  const hayAbiertos = tickets.some(
    (t) => resolverTiempoTicket(t, Date.now()).kind === "transcurrido",
  );
  const ahora = useAhora(hayAbiertos);

  const estados = useMemo(
    () => valoresUnicos(tickets.map(claveEstado), etiquetaEstado),
    [tickets],
  );
  const areas = useMemo(
    () => valoresUnicos(tickets.map(claveArea), etiquetaArea),
    [tickets],
  );
  const desarrolladores = useMemo(
    () =>
      valoresUnicos(
        tickets.flatMap(claveDesarrollador),
        etiquetaDesarrollador,
      ),
    [tickets],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tickets.filter((t) => {
      if (estado !== "todos" && claveEstado(t) !== estado) return false;
      if (area !== "todos" && claveArea(t) !== area) return false;
      if (desarrollador !== "todos" && !claveDesarrollador(t).includes(desarrollador)) {
        return false;
      }
      if (q) {
        const texto = [
          t.ticket_id,
          t.titulo ?? "",
          t.subcategoria ?? "",
          ...(t.tareas ?? []).map((x) => x.detalle ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, estado, area, desarrollador, busqueda]);

  const resumen = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tickets) {
      const k = claveEstado(t);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  }, [tickets]);

  const hayFiltros =
    estado !== "todos" ||
    area !== "todos" ||
    desarrollador !== "todos" ||
    busqueda.trim() !== "";

  const limpiar = () => {
    setBusqueda("");
    setEstado("todos");
    setDesarrollador("todos");
    setArea("todos");
  };

  return (
    <SeccionColapsable
      title="TICKETS DEV"
      defaultOpen
      badge={
        tickets.length ? (
          <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
            {tickets.length}
          </span>
        ) : undefined
      }
    >
      {tickets.length === 0 ? (
        <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
          Sin tickets de desarrollo registrados
        </p>
      ) : (
        <div className={comfortable ? "space-y-3" : "space-y-2"}>
          <ResumenEstados
            resumen={resumen}
            estadoActivo={estado}
            onEstado={(e) => setEstado((prev) => (prev === e ? "todos" : e))}
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search
                size={comfortable ? 14 : 11}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45"
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por #ticket, referencia o título"
                aria-label="Buscar tickets por número, referencia o título"
                className={cn(
                  "max-w-full rounded-md border border-black-10 bg-white pl-7 pr-2 text-black-85 outline-none placeholder:text-black-25 focus:border-primary-25",
                  comfortable ? "h-8 w-64 text-[12px]" : "h-6 w-52 text-[9px]",
                )}
              />
            </label>

            <SelectFiltro
              label="Estado"
              value={estado}
              onChange={setEstado}
              options={[
                { value: "todos", label: "Todos los estados" },
                ...estados.map((e) => ({ value: e, label: etiquetaEstado(e) })),
              ]}
            />
            <SelectFiltro
              label="Desarrollador"
              value={desarrollador}
              onChange={setDesarrollador}
              options={[
                { value: "todos", label: "Todos los desarrolladores" },
                ...desarrolladores.map((d) => ({ value: d, label: etiquetaDesarrollador(d) })),
              ]}
            />
            <SelectFiltro
              label="Área"
              value={area}
              onChange={setArea}
              options={[
                { value: "todos", label: "Todas las áreas" },
                ...areas.map((a) => ({ value: a, label: etiquetaArea(a) })),
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
            Mostrando <span className="font-medium text-black-65">{filtrados.length}</span> de{" "}
            <span className="font-medium text-black-65">{tickets.length}</span> tickets
          </p>

          {filtrados.length === 0 ? (
            <p className={comfortable ? "text-[13px] text-black-45" : "text-[9px] text-black-25"}>
              No hay tickets que coincidan con los filtros.
            </p>
          ) : (
            <div className={comfortable ? "space-y-3" : "space-y-1"}>
              {filtrados.map((t) => (
                <TicketDevCard key={`${t.localbi_id}-${t.ticket_id}`} ticket={t} ahora={ahora} />
              ))}
              {tickets.some((t) => (t.tareas ?? []).length === 0) && (
                <p className={comfortable ? "pt-1 text-[11px] text-black-45" : "pt-1 text-[8px] text-black-25"}>
                  Los tickets sin tareas asociadas no tienen expediente enlazable en el microservicio; se
                  muestran con los datos disponibles de LocalBI.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </SeccionColapsable>
  );
}

function ResumenEstados({
  resumen,
  estadoActivo,
  onEstado,
}: {
  resumen: [string, number][];
  estadoActivo: string;
  onEstado: (estado: string) => void;
}) {
  const comfortable = useDensity() === "comfortable";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {resumen.map(([e, n]) => (
        <button
          key={e}
          type="button"
          onClick={() => onEstado(e)}
          title={`Filtrar por ${etiquetaEstado(e)}`}
          className={cn(
            "inline-flex items-center rounded-md font-medium transition-colors",
            comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
            tonoEstado(e),
            estadoActivo === e && "ring-2 ring-primary-25",
          )}
        >
          {etiquetaEstado(e)} · {n}
        </button>
      ))}
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
  const comfortable = useDensity() === "comfortable";
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

function TicketDevCard({ ticket, ahora }: { ticket: LocalbiTicket; ahora: number }) {
  const [abierto, setAbierto] = useState(false);
  const comfortable = useDensity() === "comfortable";

  const tareas = ticket.tareas ?? [];
  const tareaEnlace = tareas[0]?.tarea_id ?? null;
  const href = tareaEnlace
    ? `${BASE_TAREABI}/tareabi/${encodeURIComponent(tareaEnlace)}`
    : null;

  const referencia = referenciaVerificada(ticket.titulo);
  const { titulo, resto } = textosDeTicket(ticket, referencia);
  const responsables = desarrolladoresDe(ticket);
  const areaResponsable = valor(ticket.area_responsable);
  const terminal = esTerminal(ticket.estado);
  const tiempo = resolverTiempoTicket(ticket, ahora);
  const fin = parseFecha(ticket.fecha_solucion);

  return (
    <div
      className={cn(
        "min-w-0 max-w-full rounded-lg border border-black-10",
        comfortable ? "bg-white p-4" : "bg-light p-2",
        tiempo.kind === "inconsistente" && "border-warning-25",
      )}
    >
      <div className="flex min-w-0 max-w-full flex-col gap-2">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir el expediente de la tarea en el microservicio de desarrollo"
              className={cn(
                "inline-flex max-w-full shrink-0 items-center gap-1 font-mono font-semibold text-primary hover:underline",
                comfortable ? "text-[15px]" : "text-[10px]",
              )}
            >
              #{ticket.ticket_id}
              <ExternalLink size={comfortable ? 13 : 10} aria-hidden />
            </a>
          ) : (
            <span
              title="El microservicio no expone una ruta por ticket y este ticket no tiene tareas enlazables"
              className={cn(
                "max-w-full shrink-0 font-mono font-semibold text-black-45",
                comfortable ? "text-[15px]" : "text-[10px]",
              )}
            >
              #{ticket.ticket_id}
            </span>
          )}

          <EstadoBadge estado={ticket.estado} />

          {areaResponsable && (
            <span
              className={cn(
                "inline-flex max-w-full items-center rounded-md bg-black-5 px-2 py-0.5 text-black-65",
                comfortable ? "text-[11px]" : "text-[8px]",
              )}
              title={areaResponsable}
            >
              Área: <span className="ml-1 min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">{areaResponsable}</span>
            </span>
          )}

          {valor(ticket.tipo) && (
            <span className={cn("max-w-full text-black-65", comfortable ? "text-[12px]" : "text-[9px]")}>
              {ticket.tipo}
            </span>
          )}
          {valor(ticket.subcategoria) && (
            <span className={cn("max-w-full text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
              · {ticket.subcategoria}
            </span>
          )}
        </div>

        {referencia && (
          <div className="inline-flex min-w-0 max-w-full w-fit flex-wrap items-center gap-1 rounded-md bg-black-5 px-2 py-1 font-mono text-black-65">
            <span className={comfortable ? "text-[11px]" : "text-[8px]"}>Ref.</span>
            <Referencia value={referencia} />
          </div>
        )}

        <p
          className={cn(
            "min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] font-medium text-black-85",
            comfortable ? "line-clamp-3 text-[14px] leading-snug" : "line-clamp-3 text-[10px]",
          )}
        >
          {titulo ?? <span className="font-normal text-black-45">Sin detalle disponible</span>}
        </p>

        {resto && (
          <p
            className={cn(
              "min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] line-clamp-3 text-black-65",
              comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
            )}
          >
            {resto}
          </p>
        )}
      </div>

      <div
        className={cn(
          "mt-3 grid min-w-0 max-w-full gap-x-6 gap-y-1.5 md:grid-cols-2",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        <Dato
          label="Desarrollador"
          value={responsables.length ? responsables.join(", ") : "Sin asignar"}
          tono={responsables.length ? undefined : "muted"}
        />
        <Dato label="Creado" value={fmtFechaHora(ticket.fecha_creacion)} />
        <Dato
          label="Fecha de finalización"
          value={terminal ? fmtFechaHora(ticket.fecha_solucion) : "No disponible"}
          tono={terminal && fin ? undefined : "muted"}
        />
        <Dato label="Tiempo" value={<ValorTiempo tiempo={tiempo} />} />
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

      {abierto && (
        <TicketDevDetalle ticket={ticket} ahora={ahora} referencia={referencia} />
      )}
    </div>
  );
}

function ValorTiempo({ tiempo }: { tiempo: TiempoTicket }) {
  switch (tiempo.kind) {
    case "duracion":
      if (tiempo.ms === 0 && tiempo.sinHora) {
        return <span>Duración registrada: Mismo día</span>;
      }
      return <span>Duración registrada: {fmtDuracion(tiempo.ms ?? null)}</span>;
    case "transcurrido":
      return <span>Tiempo transcurrido: {fmtDuracion(tiempo.ms ?? null)}</span>;
    case "inconsistente":
      return <span className="font-medium text-warning-65">Fechas inconsistentes</span>;
    default:
      return <span className="text-black-45">No disponible</span>;
  }
}

function TicketDevDetalle({
  ticket,
  ahora,
  referencia,
}: {
  ticket: LocalbiTicket;
  ahora: number;
  referencia: string | null;
}) {
  const comfortable = useDensity() === "comfortable";
  const tareas = ticket.tareas ?? [];
  const terminal = esTerminal(ticket.estado);
  const tiempo = resolverTiempoTicket(ticket, ahora);

  const logQueries = useTareabiLogsMulti(
    tareas.map((t) => ({ tareabiId: t.tarea_id, ticketbiId: ticket.ticket_id })),
  );
  const ultimaLog = logQueries
    .flatMap((q) => q.data?.tareas.flatMap((t) => t.historial.map((h) => h.fecha)) ?? [])
    .filter((f): f is string => Boolean(f))
    .map((raw) => ({ raw, d: parseFecha(raw) }))
    .filter((x): x is { raw: string; d: Date } => Boolean(x.d))
    .sort((a, b) => b.d.getTime() - a.d.getTime())[0]?.raw;

  const ultima = [
    ticket.fecha_creacion,
    ticket.fecha_solucion,
    ...tareas.flatMap((t) => [t.fecha_inicio, t.fecha_fin, t.fecha_solicitud]),
    ultimaLog,
  ]
    .map((raw) => ({ raw, d: parseFecha(raw) }))
    .filter((x): x is { raw: string; d: Date } => Boolean(x.d))
    .sort((a, b) => b.d.getTime() - a.d.getTime())[0]?.raw;

  const observacion = valor(ticket.observaciones);
  const areaResponsable = valor(ticket.area_responsable);
  const { descripcion } = textosDeTicket(ticket, referencia);
  const descripciones = [
    ...new Set(
      [
        ...tareas.map((t) => valor(t.detalle)),
        descripcion,
      ].filter((v): v is string => Boolean(v)),
    ),
  ];

  return (
    <div
      className={cn(
        "min-w-0 max-w-full border-t border-black-10",
        comfortable ? "mt-3 space-y-3 pt-3" : "mt-2 space-y-2 pt-2",
      )}
    >
      <div
        className={cn(
          "grid min-w-0 max-w-full gap-x-6 gap-y-1.5 md:grid-cols-2",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        <Dato label="Estado actual" value={<EstadoBadge estado={ticket.estado} />} />
        <Dato
          label="Área responsable"
          value={areaResponsable ?? "No disponible"}
          tono={areaResponsable ? undefined : "muted"}
        />
        <Dato
          label="Última actualización"
          value={fmtFechaHora(ultima)}
          tono={parseFecha(ultima) ? undefined : "muted"}
        />
        <Dato label="Tiempo" value={<ValorTiempo tiempo={tiempo} />} />
        <Dato
          label="Fecha de finalización"
          value={terminal ? fmtFechaHora(ticket.fecha_solucion) : "No disponible"}
          tono={terminal && parseFecha(ticket.fecha_solucion) ? undefined : "muted"}
        />
        {referencia && <Dato label="Referencia" value={<Referencia value={referencia} />} />}
      </div>

      {descripciones.length > 0 && (
        <div className="min-w-0 max-w-full">
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Descripción del requerimiento
          </p>
          <p
            className={cn(
              "mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-black-85",
              comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
            )}
          >
            {descripciones.join("\n\n")}
          </p>
        </div>
      )}

      {observacion && (
        <div className="min-w-0 max-w-full">
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Observación / conclusión
          </p>
          <p
            className={cn(
              "mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-black-65",
              comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
            )}
          >
            {observacion}
          </p>
        </div>
      )}

      <div className="min-w-0 max-w-full">
        <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
          Tareas asociadas ({tareas.length})
        </p>
        {tareas.length === 0 ? (
          <p className={cn("mt-1 text-black-45", comfortable ? "text-[13px]" : "text-[9px]")}>
            Sin tareas asociadas. La fuente no expone detalle a nivel de ticket.
          </p>
        ) : (
          <div className={comfortable ? "mt-2 space-y-2" : "mt-1 space-y-1"}>
            {tareas.map((t) => (
              <TareaDevItem
                key={t.tarea_id}
                tarea={t}
                ticketId={ticket.ticket_id}
                descripcionTicket={descripciones[0] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TareaDevItem({
  tarea,
  ticketId,
  descripcionTicket,
}: {
  tarea: LocalbiTarea;
  ticketId: string;
  descripcionTicket: string | null;
}) {
  const comfortable = useDensity() === "comfortable";
  const { data: logs, isLoading } = useTareabiLogs(tarea.tarea_id, ticketId);
  const log = logs?.tareas.find((x) => x.tareabi_id === tarea.tarea_id);

  const estado = valor(tarea.estado) ?? log?.tarea_estado ?? null;
  const dev = valor(tarea.responsable) ?? log?.responsable ?? null;
  const referencia = log?.referencia ?? null;
  const descripcion = valor(tarea.detalle) ?? log?.descripcion ?? null;
  const inicio = valor(tarea.fecha_inicio) ?? log?.fecha_inicio ?? null;
  const fin = valor(tarea.fecha_fin) ?? log?.fecha_fin ?? null;
  const conclusion = valor(tarea.conclusion);

  const href = `${BASE_TAREABI}/tareabi/${encodeURIComponent(tarea.tarea_id)}`;

  return (
    <div
      className={cn(
        "min-w-0 max-w-full rounded-lg border border-black-10 bg-white",
        comfortable ? "p-3" : "border-black-5 p-1.5",
      )}
    >
      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-between gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir esta tarea en el microservicio de desarrollo"
          className={cn(
            "inline-flex max-w-full items-center gap-1 font-mono text-primary hover:underline",
            comfortable ? "text-[13px]" : "text-[9px]",
          )}
        >
          Tarea #{tarea.tarea_id}
          <ExternalLink size={comfortable ? 12 : 9} aria-hidden />
        </a>
        <EstadoBadge estado={estado} />
      </div>

      <div
        className={cn(
          "mt-2 grid min-w-0 max-w-full gap-x-5 gap-y-1 md:grid-cols-2",
          comfortable ? "text-[12px]" : "text-[9px]",
        )}
      >
        <Dato label="Desarrollador" value={dev ?? "Sin asignar"} tono={dev ? undefined : "muted"} />
        <Dato label="Inicio" value={fmtFechaHora(inicio)} tono={inicio ? undefined : "muted"} />
        <Dato label="Fin" value={fin ? fmtFechaHora(fin) : "No disponible"} tono={fin ? undefined : "muted"} />
        {referencia && <Dato label="Referencia" value={<Referencia value={referencia} />} />}
      </div>

      {descripcion && descripcion !== descripcionTicket && (
        <p
          className={cn(
            "mt-2 whitespace-pre-line break-words [overflow-wrap:anywhere] text-black-65",
            comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
          )}
        >
          {descripcion}
        </p>
      )}

      {conclusion && (
        <p className={cn("mt-2 whitespace-pre-line break-words [overflow-wrap:anywhere] text-black-65", comfortable ? "text-[12px]" : "text-[9px]")}>
          <span className="font-medium">Conclusión:</span> {conclusion}
        </p>
      )}

      <div className={cn("border-t border-black-5", comfortable ? "mt-3 pt-2" : "mt-1.5 pt-1")}>
        {isLoading ? (
          <p className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
            Consultando historial…
          </p>
        ) : log && log.historial.length > 0 ? (
          <Historial entradas={log.historial} />
        ) : (
          <p className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
            Sin historial de cambios disponible.
          </p>
        )}
      </div>
    </div>
  );
}

function Historial({ entradas }: { entradas: TareabiHistorialEntrada[] }) {
  const comfortable = useDensity() === "comfortable";
  return (
    <div className={comfortable ? "space-y-1.5" : "space-y-0.5"}>
      <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
        Historial
      </p>
      {entradas.map((h, i) => (
        <div
          key={`${h.fecha ?? "sin-fecha"}-${i}`}
          className={cn(
            "flex min-w-0 max-w-full flex-wrap items-start text-black-65",
            comfortable ? "gap-x-2.5 gap-y-1 text-[12px]" : "gap-x-2 text-[8px] text-black-45",
          )}
        >
          <span className="shrink-0 tabular-nums">{fmtFechaHora(h.fecha)}</span>
          {h.persona && (
            <span className="min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] font-medium text-black-65">
              {h.persona}
            </span>
          )}
          {h.accion && (
            <span className={cn("min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
              {h.accion}
            </span>
          )}
          {h.cambios.map((c, j) => (
            <span
              key={j}
              className={cn(
                "inline-block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] rounded bg-black-5 text-black-65",
                comfortable ? "px-1.5 py-0.5 text-[11px]" : "px-1 text-[8px] text-black-45",
              )}
            >
              {c.campo}: {valor(c.anterior) ?? "—"} → {valor(c.nuevo) ?? "—"}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Referencia: URL clicable o texto; siempre envuelve dentro del ancho. */
function Referencia({ value }: { value: string }) {
  const items = value.split(/\s+/).filter(Boolean);
  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap gap-x-2 gap-y-1 align-middle">
      {items.map((x, i) =>
        /^https?:\/\//i.test(x) ? (
          <a
            key={`${x}-${i}`}
            href={x}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-primary hover:underline"
            title={x}
          >
            {x}
          </a>
        ) : (
          <span
            key={`${x}-${i}`}
            className="min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere]"
            title={x}
          >
            {x}
          </span>
        ),
      )}
    </span>
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
  const comfortable = useDensity() === "comfortable";
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
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string | null | undefined }) {
  const comfortable = useDensity() === "comfortable";
  if (!estado) return <span className="text-black-10">—</span>;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        tonoEstado(estado),
      )}
    >
      {estado}
    </span>
  );
}
