import type { TareaIndependiente } from "../types/localbi";

/**
 * Utilidades de fecha y duración para TAREAS independientes.
 *
 * Reglas:
 * - No se inventan fechas ni horas.
 * - `fecha_fin` es una fecha REGISTRADA, no necesariamente el cierre definitivo.
 * - Si `fecha_fin < fecha_inicio`, se marca inconsistencia y no se calcula duración.
 * - El tiempo transcurrido solo se calcula si existe `fecha_inicio` válida.
 */

export type TiempoTarea =
  | { kind: "sin_datos" }
  | { kind: "sin_inicio"; fin: Date | null }
  | { kind: "sin_fin"; inicio: Date }
  | { kind: "inconsistente"; inicio: Date; fin: Date }
  | { kind: "duracion"; inicio: Date; fin: Date; ms: number; finalizada: boolean }
  | { kind: "transcurrido"; inicio: Date; ms: number };

/**
 * Catálogo verificado de estados finales de Tareabi
 * (`obtenerDatosEstaticos.estadosFinalesList`).
 */
const ESTADOS_FINALES = [
  "Subido a Producción",
  "Completo",
  "Rechazado",
  "Rechazado - Mal analisis",
  "Falta de información",
  "Pendiente de diseño",
  "No necesita",
  "No replicable",
  "Ticket duplicado",
];

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ESTADOS_FINALES_NORM = new Set(ESTADOS_FINALES.map(normalizar));

export function esEstadoFinal(estado: string | null | undefined): boolean {
  return Boolean(estado && ESTADOS_FINALES_NORM.has(normalizar(estado)));
}

/** Parsea "YYYY-MM-DD[ HH:mm[:ss]]" como hora local (Lima), sin TZ implícita. */
export function parseFechaLocal(v: string | null | undefined): Date | null {
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
export function tieneHora(v: string | null | undefined): boolean {
  const m = v?.trim().match(/[ T](\d{2}):(\d{2})/);
  return Boolean(m && !(m[1] === "00" && m[2] === "00"));
}

export function fmtFechaHora(v: string | null | undefined): string {
  const d = parseFechaLocal(v);
  if (!d) return "No disponible";
  const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  if (!tieneHora(v)) return fecha;
  return `${fecha}, ${d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Duración legible: "2 días, 4 horas" / "3 horas, 12 min" / "45 min". */
export function fmtDuracion(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "No disponible";
  if (ms === 0) return "0 min";
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

/** Normaliza texto de la fuente: vacío y cadenas de guiones son "no disponible". */
export function textoValido(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s && !/^-+$/.test(s) ? s : null;
}

export function primeraLinea(v: string): string {
  return v.split(/\r?\n/).map((x) => x.trim()).find(Boolean) ?? v;
}

/** Título visible: título real, primera línea de la descripción o identificador. */
export function tituloTarea(
  t: Pick<TareaIndependiente, "tarea_id" | "titulo" | "detalle">,
): string {
  return textoValido(t.titulo) ?? (textoValido(t.detalle) ? primeraLinea(t.detalle) : `Tarea #${t.tarea_id}`);
}

/**
 * Resuelve el bloque temporal de la tarea.
 * No calcula duración si las fechas son inconsistentes.
 */
export function resolverTiempoTarea(t: TareaIndependiente, ahora: number): TiempoTarea {
  const inicio = parseFechaLocal(t.fecha_inicio);
  const fin = parseFechaLocal(t.fecha_fin);
  const finalizada = esEstadoFinal(t.estado);

  if (inicio && fin) {
    if (fin.getTime() < inicio.getTime()) {
      return { kind: "inconsistente", inicio, fin };
    }
    if (finalizada) {
      return { kind: "duracion", inicio, fin, ms: fin.getTime() - inicio.getTime(), finalizada: true };
    }
    // Tarea no finalizada con fecha fin registrada: no se usa como cierre definitivo.
    return { kind: "transcurrido", inicio, ms: Math.max(0, ahora - inicio.getTime()) };
  }

  if (inicio) {
    if (finalizada) return { kind: "sin_fin", inicio };
    return { kind: "transcurrido", inicio, ms: Math.max(0, ahora - inicio.getTime()) };
  }

  return { kind: "sin_inicio", fin };
}

/**
 * Fecha confiable para ordenar el evento en el Historial Transversal.
 * Prioriza un rango coherente; si no, inicio; si no, solicitud.
 */
export function fechaEventoTarea(t: TareaIndependiente): string | null {
  const inicio = parseFechaLocal(t.fecha_inicio);
  const fin = parseFechaLocal(t.fecha_fin);
  if (inicio && fin && fin.getTime() >= inicio.getTime() && t.fecha_fin) return t.fecha_fin;
  if (inicio && t.fecha_inicio) return t.fecha_inicio;
  if (parseFechaLocal(t.fecha_solicitud) && t.fecha_solicitud) return t.fecha_solicitud;
  if (fin && t.fecha_fin) return t.fecha_fin;
  return null;
}

/** Tono semántico del estado. No crea estados: solo colorea los existentes. */
export function tonoEstadoTarea(estado: string | null | undefined): string {
  const e = normalizar(estado ?? "");
  if (/rechaz|cancel/.test(e)) return "bg-danger-5 text-danger";
  if (/complet|resuelt|cerrad|hecho/.test(e)) return "bg-success-5 text-success";
  if (/pendiente/.test(e)) return "bg-warning-5 text-warning-65";
  if (/pausa/.test(e)) return "bg-warning-5 text-warning-65";
  if (/proceso|prueba|produccion|desarrollo/.test(e)) return "bg-primary-5 text-primary";
  if (/no necesita|duplicado|falta de informacion|no replicable/.test(e)) return "bg-black-5 text-black-65";
  return "bg-black-5 text-black-45";
}
