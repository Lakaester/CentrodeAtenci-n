/**
 * Utilidades de fecha para Quejas y Devoluciones.
 *
 * `fecha_solicitud` representa la fecha de origen del ticket (columna Fecha
 * del módulo). Es TEXT y acepta `YYYY-MM-DD` o el instante exacto
 * `YYYY-MM-DDTHH:MM:SSZ` (UTC, sin conversión de zona). `created_at` sigue
 * representando la incorporación del expediente a COPE y no se sobrescribe.
 */

const LIMA_TZ = "America/Lima";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LIMA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Convierte un timestamp ISO/Date a YYYY-MM-DD en America/Lima. */
export function fechaLima(valor: string | Date | null | undefined): string | null {
  if (valor == null || valor === "") return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const partes = formatter.formatToParts(fecha);
  const año = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  const dia = partes.find((p) => p.type === "day")?.value;
  if (!año || !mes || !dia) return null;
  return `${año}-${mes}-${dia}`;
}

/** Fecha actual en America/Lima (YYYY-MM-DD). */
export function fechaLimaHoy(): string {
  return fechaLima(new Date()) as string;
}

/**
 * Conserva el instante original del ticket como ISO UTC exacto
 * (YYYY-MM-DDTHH:MM:SSZ), sin convertir de zona horaria.
 *
 * Se usa para `fecha_solicitud`: la columna es TEXT y la fecha con hora es el
 * dato verificable de `tickets_created_at`. No debe usarse la fecha del
 * proceso ni una conversión a America/Lima.
 */
export function fechaOrigenExacta(valor: string | Date | null | undefined): string | null {
  if (valor == null || valor === "") return null;
  if (typeof valor === "string") {
    const s = valor.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s)) return s;
  }
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  // `toISOString` siempre devuelve UTC; se conserva la hora original.
  return fecha.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Día (YYYY-MM-DD) del instante original, tomado en UTC sin conversión de
 * zona horaria. Es la parte visible/filtrable de `fecha_solicitud`.
 */
export function fechaOrigenDia(valor: string | Date | null | undefined): string | null {
  const exacta = fechaOrigenExacta(valor);
  return exacta ? exacta.slice(0, 10) : null;
}

/** Valida el formato YYYY-MM-DD y que sea una fecha real. */
export function esFechaISO(valor: string | null | undefined): boolean {
  if (!valor) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return false;
  return fecha.toISOString().slice(0, 10) === valor;
}
