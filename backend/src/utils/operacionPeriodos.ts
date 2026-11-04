/** Periodos de evolución del reporte Operación. */
export type GranularidadOperacion = "diaria" | "semanal" | "mensual" | "trimestral";

function fechaUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Inicio del bucket que contiene la fecha. */
export function inicioPeriodo(iso: string, g: GranularidadOperacion): string {
  const d = fechaUtc(iso);
  if (g === "diaria") return fmt(d);
  if (g === "semanal") {
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - (day - 1));
    return fmt(d);
  }
  if (g === "mensual") return fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  const q = Math.floor(d.getUTCMonth() / 3) * 3;
  return fmt(new Date(Date.UTC(d.getUTCFullYear(), q, 1)));
}

/** Etiqueta visible del bucket. */
export function etiquetaPeriodo(iso: string, g: GranularidadOperacion): string {
  if (g === "diaria") return iso;
  if (g === "mensual") return iso.slice(0, 7);
  if (g === "trimestral") {
    const d = fechaUtc(iso);
    return `${d.getUTCFullYear()}-T${Math.floor(d.getUTCMonth() / 3) + 1}`;
  }
  const d = fechaUtc(iso);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function siguientePeriodo(iso: string, g: GranularidadOperacion): string {
  const d = fechaUtc(iso);
  if (g === "diaria") {
    d.setUTCDate(d.getUTCDate() + 1);
    return fmt(d);
  }
  if (g === "semanal") {
    d.setUTCDate(d.getUTCDate() + 7);
    return fmt(d);
  }
  const meses = g === "mensual" ? 1 : 3;
  return fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + meses, 1)));
}

/** Lista completa de inicios de periodo entre la fecha inicial y final. */
export function generarPeriodos(
  inicio: string,
  fin: string,
  g: GranularidadOperacion,
): string[] {
  if (!inicio || !fin || inicio > fin) return [];
  let cur = inicioPeriodo(inicio, g);
  const out: string[] = [];
  let guard = 0;
  while (cur <= fin && guard < 5000) {
    out.push(cur);
    cur = siguientePeriodo(cur, g);
    guard += 1;
  }
  return out;
}
