import type { SeguimientoEstado } from "./types";

const LIMA = "America/Lima";

export function fechaLimaISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Semana ISO (YYYY-Www) de una fecha YYYY-MM-DD. */
export function semanaDe(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  const jueves = new Date(d);
  jueves.setUTCDate(d.getUTCDate() + 4 - dow);
  const year = jueves.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((jueves.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function semanaActual(): string {
  return semanaDe(fechaLimaISO());
}

export function lunesDeSemana(semana: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(semana);
  if (!m) return fechaLimaISO();
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - dow + 1);
  const lunes = new Date(week1);
  lunes.setUTCDate(week1.getUTCDate() + (week - 1) * 7);
  return lunes.toISOString().slice(0, 10);
}

export function periodoDeSemana(semana: string): string {
  return lunesDeSemana(semana).slice(0, 7);
}

export function lunesDePeriodo(periodo: string): string {
  return `${periodo}-01`;
}

/** Valor para <input type="datetime-local"> en America/Lima. */
export function ahoraLocalInput(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
}

/** Convierte "YYYY-MM-DDTHH:mm" o "YYYY-MM-DD HH:mm" al formato del backend. */
export function aFechaHoraLocal(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

/** Convierte una fecha del backend a valor de <input type="datetime-local">. */
export function aInputLocal(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
}

export function fmtFechaHora(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const iso = normalized.length <= 16 ? `${normalized}:00-05:00` : normalized;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: LIMA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function fmtFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

export function fmtMes(periodo: string | null | undefined): string {
  if (!periodo) return "—";
  const [y, m] = periodo.split("-").map(Number);
  if (!y || !m) return periodo;
  const label = new Intl.DateTimeFormat("es-PE", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function fmtSemana(semana: string | null | undefined): string {
  if (!semana) return "—";
  const lunes = lunesDeSemana(semana);
  return `Semana ${semana.split("-W")[1]} · ${fmtFecha(lunes)}`;
}

export function fmtDuracion(min: number | null | undefined): string {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

export function fmtVariacion(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

export const ESTADO_UI: Record<
  SeguimientoEstado,
  { label: string; dot: string; badge: "default" | "warning" | "success" }
> = {
  sin_seguimiento: { label: "Sin seguimiento", dot: "bg-black-25", badge: "default" },
  con_pendientes: { label: "Con pendientes", dot: "bg-warning", badge: "warning" },
  finalizado: { label: "Finalizado", dot: "bg-success", badge: "success" },
};

export function estadosPermitidos(actual: SeguimientoEstado): SeguimientoEstado[] {
  if (actual === "finalizado") return ["con_pendientes"];
  return ["con_pendientes", "finalizado"];
}

export function motivoClase(motivo: string): string {
  if (motivo.startsWith("Incumplimiento")) return "bg-danger-5 text-danger";
  if (motivo.startsWith("Tiempo")) return "bg-warning-5 text-warning";
  if (motivo.startsWith("Aumento")) return "bg-primary-5 text-primary";
  if (motivo.startsWith("Reincidencia")) return "bg-purple-5 text-purple";
  return "bg-black-5 text-black-65";
}

export function canalClase(canal: string): string {
  const c = canal.toUpperCase();
  if (c.includes("WHAT")) return "bg-success-5 text-success";
  if (c.includes("ZENDESK") || c.includes("CORREO")) return "bg-primary-5 text-primary";
  return "bg-black-5 text-black-65";
}
