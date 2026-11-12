export function fmtInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("es-PE");
}

export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function fmtMin(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value < 60) return `${Math.round(value)} min`;
  if (value < 1440) return `${(value / 60).toFixed(1)} h`;
  return `${(value / 1440).toFixed(1)} d`;
}

export function fmtDateShort(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export function fmtDateLong(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function fmtRange(inicio?: string | null, fin?: string | null): string {
  if (!inicio || !fin) return "Periodo no definido";
  return `${fmtDateLong(inicio)} — ${fmtDateLong(fin)}`;
}

export function fmtDateTime(fecha: string, hora: string): string {
  return [fecha, hora].filter(Boolean).join(" ");
}

export function fmtNumberCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}
