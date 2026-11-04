import { createContext, useContext, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useTareabiLogs, useTareabiLogsMulti } from "@/modules/tareabi";
import type { TareabiHistorialEntrada } from "@/modules/tareabi";
import type { LocalbiTarea, LocalbiTicket } from "../../types/localbi";
import { SeccionColapsable } from "../HistoriaClinicaUI";
import { config } from "@/config/env";
import { cn } from "@/lib/utils";

/**
 * TICKETS DEV — tickets de desarrollo (LocalBI → Tareabi).
 *
 * No son atenciones de COPE ni incidencias de Soporte en Línea.
 * - Ticket: datos de LocalBI (estado, fechas, área, tareas).
 * - Tarea: detalle + historial de Tareabi bajo demanda.
 * - Enlace externo: ruta oficial verificada de Tareabi por `tareabi_id`.
 *
 * Regla de oro: no se inventan fechas, desarrolladores, referencias ni estados.
 * Si la fuente no entrega un dato, se muestra explícitamente "No disponible".
 */

const BASE_TAREABI = config.tareabiApiUrl.replace(/\/+$/, "");

type TicketsDensity = "compact" | "comfortable";

/**
 * Densidad propia de la sección. Clientes la usa en variante comfortable;
 * el valor por defecto cubre ese caso sin depender del proveedor global.
 */
const DensityContext = createContext<TicketsDensity>("comfortable");
function useDensity(): TicketsDensity {
  return useContext(DensityContext);
}

/** Parsea "YYYY-MM-DD[ HH:mm[:ss]]" como hora local (Lima), sin TZ implícita. */
function parseFecha(v: string | null | undefined): Date | null {
  if (!v) return null;
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

/** La fuente a veces entrega solo fecha (00:00:00); no se inventa una hora. */
function tieneHora(v: string | null | undefined): boolean {
  const m = v?.trim().match(/[ T](\d{2}):(\d{2})/);
  return Boolean(m && !(m[1] === "00" && m[2] === "00"));
}

function fmtFechaHora(v: string | null | undefined): string {
  const d = parseFecha(v);
  if (!d) return "—";
  const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  if (!tieneHora(v)) return fecha;
  return `${fecha}, ${d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Duración legible: "2 días, 4 horas" / "3 horas, 12 min" / "45 min". */
function fmtDuracion(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "menos de 1 min";
  const dias = Math.floor(min / 1440);
  const horas = Math.floor((min % 1440) / 60);
  const minutos = min % 60;
  const partes: string[] = [];
  if (dias) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);
  if (horas) partes.push(`${horas} ${horas === 1 ? "hora" : "horas"}`);
  if (!dias && minutos) partes.push(`${minutos} min`);
  return partes.join(", ");
}

function esTerminal(estado: string | null | undefined): boolean {
  return /complet|rechaz|cerrad|resuelt|cancel/i.test(estado ?? "");
}

/** Duración total de un ticket finalizado. No inventa precisión si solo hay fecha. */
function fmtResolucion(creado: Date | null, fin: Date | null): string {
  if (!creado || !fin) return "No disponible";
  if (fin.getTime() <= creado.getTime()) {
    const mismoDia =
      creado.getFullYear() === fin.getFullYear() &&
      creado.getMonth() === fin.getMonth() &&
      creado.getDate() === fin.getDate();
    return mismoDia ? "Mismo día" : "0 min";
  }
  return fmtDuracion(fin.getTime() - creado.getTime());
}

function tonoEstado(estado: string | null | undefined): string {
  const e = (estado ?? "").toLowerCase();
  if (/rechaz|cancel/.test(e)) return "bg-danger-5 text-danger";
  if (/complet|resuelt|cerrad|hecho/.test(e)) return "bg-success-5 text-success";
  if (/pendiente/.test(e)) return "bg-warning-5 text-warning-65";
  if (/proceso|curso|prueba|desarrollo|producci/.test(e)) return "bg-primary-5 text-primary";
  return "bg-black-5 text-black-45";
}

/** Normaliza un campo de texto de la fuente: "-" y vacío son "no disponible". */
function valor(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s && s !== "-" ? s : null;
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
  const hayAbiertos = tickets.some((t) => !esTerminal(t.estado));
  const ahora = useAhora(hayAbiertos);

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
        <div className={comfortable ? "space-y-3" : "space-y-1"}>
          {tickets.map((t) => (
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
    </SeccionColapsable>
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

  const referencia = valor(ticket.titulo);
  const descripcion = tareas.map((t) => valor(t.detalle)).find((v): v is string => Boolean(v)) ?? null;
  const lineasDescripcion = descripcion
    ? descripcion.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
    : [];
  const titulo = lineasDescripcion[0] ?? null;
  const restoDescripcion = lineasDescripcion.length > 1 ? lineasDescripcion.slice(1).join("\n") : null;

  const responsables = [
    ...new Set(
      tareas.map((t) => valor(t.responsable)).filter((v): v is string => Boolean(v)),
    ),
  ];

  const creado = parseFecha(ticket.fecha_creacion);
  const fin = parseFecha(ticket.fecha_solucion);
  const terminal = esTerminal(ticket.estado);
  const duracion = terminal
    ? creado && fin
      ? fin.getTime() - creado.getTime()
      : null
    : creado
      ? ahora - creado.getTime()
      : null;

  const ultima = [
    ticket.fecha_creacion,
    ticket.fecha_solucion,
    ...tareas.flatMap((t) => [t.fecha_inicio, t.fecha_fin, t.fecha_solicitud]),
  ]
    .map((raw) => ({ raw, d: parseFecha(raw) }))
    .filter((x): x is { raw: string; d: Date } => Boolean(x.d))
    .sort((a, b) => b.d.getTime() - a.d.getTime())[0]?.raw;

  return (
    <div
      className={cn(
        "rounded-lg border border-black-10",
        comfortable ? "bg-white p-4" : "border-black-10 bg-light p-2",
      )}
    >
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col items-start gap-1">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir el expediente de la tarea en el microservicio de desarrollo"
              className={cn(
                "inline-flex items-center gap-1 font-mono font-semibold text-primary hover:underline",
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
                "font-mono font-semibold text-black-45",
                comfortable ? "text-[15px]" : "text-[10px]",
              )}
            >
              #{ticket.ticket_id}
            </span>
          )}
          {referencia && (
            <span
              className={cn(
                "rounded bg-black-5 font-mono text-black-65",
                comfortable ? "px-1.5 py-0.5 text-[11px]" : "px-1 py-0.5 text-[8px]",
              )}
              title="Referencia externa registrada en el ticket"
            >
              Ref. {referencia}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={ticket.estado} />
            {valor(ticket.tipo) && (
              <span className={comfortable ? "text-[12px] text-black-65" : "text-[9px] text-black-45"}>
                {ticket.tipo}
              </span>
            )}
            {valor(ticket.subcategoria) && (
              <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
                · {ticket.subcategoria}
              </span>
            )}
          </div>
          <p
            className={cn(
              "mt-1 font-medium text-black-85",
              comfortable ? "line-clamp-2 text-[14px] leading-snug" : "line-clamp-2 text-[10px]",
            )}
          >
            {titulo ?? <span className="font-normal text-black-45">Sin detalle disponible</span>}
          </p>
          {restoDescripcion && (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-black-65",
                comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
              )}
            >
              {restoDescripcion}
            </p>
          )}
        </div>
      </div>

      {/* Información temporal */}
      <div
        className={cn(
          "mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        <Dato
          label="Desarrollador"
          value={responsables.length ? responsables.join(", ") : "Sin asignar"}
          tono={responsables.length ? undefined : "muted"}
        />
        <Dato label="Creado" value={fmtFechaHora(ticket.fecha_creacion)} />
        {terminal ? (
          <>
            <Dato
              label="Fecha de finalización"
              value={ticket.fecha_solucion ? fmtFechaHora(ticket.fecha_solucion) : "No disponible"}
              tono={ticket.fecha_solucion ? undefined : "muted"}
            />
            <Dato
              label="Tiempo total de resolución"
              value={terminal ? fmtResolucion(creado, fin) : "No disponible"}
              tono={creado && fin ? undefined : "muted"}
            />
          </>
        ) : (
          <>
            <Dato
              label="Tiempo transcurrido"
              value={duracion != null ? fmtDuracion(duracion) : "No disponible"}
              tono={duracion != null ? undefined : "muted"}
            />
            <Dato label="Fecha de finalización" value="No disponible" tono="muted" />
          </>
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className={cn(
            "inline-flex items-center gap-1 font-medium text-primary hover:underline",
            comfortable ? "text-[13px]" : "text-[9px]",
          )}
        >
          {abierto ? <ChevronDown size={comfortable ? 14 : 10} /> : <ChevronRight size={comfortable ? 14 : 10} />}
          {abierto ? "Ocultar detalle" : "Ver detalle"}
        </button>
      </div>

      {abierto && (
        <TicketDevDetalle ticket={ticket} ahora={ahora} ultimaActualizacion={ultima} />
      )}
    </div>
  );
}

function TicketDevDetalle({
  ticket,
  ahora,
  ultimaActualizacion,
}: {
  ticket: LocalbiTicket;
  ahora: number;
  ultimaActualizacion?: string;
}) {
  const comfortable = useDensity() === "comfortable";
  const tareas = ticket.tareas ?? [];
  const terminal = esTerminal(ticket.estado);
  const creado = parseFecha(ticket.fecha_creacion);
  const fin = parseFecha(ticket.fecha_solucion);
  const duracion = terminal
    ? creado && fin
      ? fin.getTime() - creado.getTime()
      : null
    : creado
      ? ahora - creado.getTime()
      : null;

  const logQueries = useTareabiLogsMulti(
    tareas.map((t) => ({ tareabiId: t.tarea_id, ticketbiId: ticket.ticket_id })),
  );
  const ultimaLog = logQueries
    .flatMap((q) => q.data?.tareas.flatMap((t) => t.historial.map((h) => h.fecha)) ?? [])
    .filter((f): f is string => Boolean(f))
    .map((raw) => ({ raw, d: parseFecha(raw) }))
    .filter((x): x is { raw: string; d: Date } => Boolean(x.d))
    .sort((a, b) => b.d.getTime() - a.d.getTime())[0]?.raw;
  const ultima = ultimaLog ?? ultimaActualizacion;

  const referencia = valor(ticket.titulo);
  const observacion = valor(ticket.observaciones);
  const areaResponsable = valor(ticket.area_responsable);
  const descripciones = [
    ...new Set(tareas.map((t) => valor(t.detalle)).filter((v): v is string => Boolean(v))),
  ];

  return (
    <div
      className={cn(
        "border-t border-black-10",
        comfortable ? "mt-3 space-y-3 pt-3" : "mt-2 space-y-2 pt-2",
      )}
    >
      <div
        className={cn(
          "grid gap-x-6 gap-y-1.5 sm:grid-cols-2",
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
        <Dato
          label={terminal ? "Tiempo total de resolución" : "Tiempo transcurrido"}
          value={terminal ? fmtResolucion(creado, fin) : duracion != null ? fmtDuracion(duracion) : "No disponible"}
          tono={terminal ? (creado && fin ? undefined : "muted") : duracion != null ? undefined : "muted"}
        />
        {terminal && (
          <Dato
            label="Fecha de finalización"
            value={ticket.fecha_solucion ? fmtFechaHora(ticket.fecha_solucion) : "No disponible"}
            tono={ticket.fecha_solucion ? undefined : "muted"}
          />
        )}
        {referencia && <Dato label="Referencia" value={<Referencia value={referencia} />} mono />}
      </div>

      {descripciones.length > 0 && (
        <div>
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Descripción del requerimiento
          </p>
          <p
            className={cn(
              "mt-1 whitespace-pre-line text-black-85",
              comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
            )}
          >
            {descripciones.join("\n\n")}
          </p>
        </div>
      )}

      {observacion && (
        <div>
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Observación / conclusión
          </p>
          <p
            className={cn(
              "mt-1 whitespace-pre-line text-black-65",
              comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
            )}
          >
            {observacion}
          </p>
        </div>
      )}

      <div>
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
        "rounded-lg border border-black-10 bg-white",
        comfortable ? "p-3" : "border-black-5 p-1.5",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir esta tarea en el microservicio de desarrollo"
          className={cn(
            "inline-flex items-center gap-1 font-mono text-primary hover:underline",
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
          "mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2",
          comfortable ? "text-[12px]" : "text-[9px]",
        )}
      >
        <Dato label="Desarrollador" value={dev ?? "Sin asignar"} tono={dev ? undefined : "muted"} />
        <Dato label="Inicio" value={fmtFechaHora(inicio)} tono={inicio ? undefined : "muted"} />
        <Dato label="Fin" value={fin ? fmtFechaHora(fin) : "No disponible"} tono={fin ? undefined : "muted"} />
        {referencia && <Dato label="Referencia" value={<Referencia value={referencia} />} mono />}
      </div>

      {descripcion && descripcion !== descripcionTicket && (
        <p
          className={cn(
            "mt-2 whitespace-pre-line text-black-65",
            comfortable ? "text-[13px] leading-relaxed" : "text-[9px]",
          )}
        >
          {descripcion}
        </p>
      )}

      {conclusion && (
        <p className={cn("mt-2 text-black-65", comfortable ? "text-[12px]" : "text-[9px]")}>
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
            "flex flex-wrap items-center text-black-65",
            comfortable ? "gap-x-2.5 gap-y-1 text-[12px]" : "gap-x-2 text-[8px] text-black-45",
          )}
        >
          <span className="shrink-0 tabular-nums">{fmtFechaHora(h.fecha)}</span>
          {h.persona && <span className="shrink-0 font-medium text-black-65">{h.persona}</span>}
          {h.accion && <span className={cn("shrink-0 text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>{h.accion}</span>}
          {h.cambios.map((c, j) => (
            <span
              key={j}
              className={cn(
                "rounded bg-black-5 text-black-65",
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

/** Referencia: si es URL se abre en el proveedor original; si es código se muestra tal cual. */
function Referencia({ value }: { value: string }) {
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-primary hover:underline"
        title={value}
      >
        {value}
      </a>
    );
  }
  return <span title={value}>{value}</span>;
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
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className={cn("shrink-0", comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25")}>
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-right font-medium",
          mono && "font-mono",
          tono === "muted" ? "text-black-45" : "text-black-85",
          comfortable ? "text-[13px]" : "text-[9px]",
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
        "inline-flex items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        tonoEstado(estado),
      )}
    >
      {estado}
    </span>
  );
}
