/** Formateadores y constantes visuales del módulo Calidad de Registro. */
export const CANAL_ORDER = ["WHATICKET", "WHATMETA", "ZENDESK"] as const;

export const CANAL_LABELS: Record<string, string> = {
  WHATICKET: "WATICKET",
  WHATMETA: "WAMETA",
  ZENDESK: "ZENDESK",
  TODOS: "TODOS",
};

export const C = {
  verde: "#10b981",
  verdeOscuro: "#0f766e",
  ambar: "#f59e0b",
  rojo: "#ef4444",
  azul: "#3b82f6",
  gris: "#94a3b8",
  violeta: "#8b5cf6",
  naranja: "#f97316",
};

export function canalLabel(canal: string): string {
  return CANAL_LABELS[canal] ?? canal;
}

export function fmtNum(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString("es-PE");
}

export function fmtPct(n: number | null | undefined): string {
  return n == null ? "—" : `${n.toFixed(1)}%`;
}

export function fmtPp(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)} pp`;
}

/** Magnitud de una brecha: sin signo. */
export function fmtPpAbs(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.abs(n).toFixed(1)} pp`;
}

export function fmtPctDelta(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function deltaClass(
  n: number | null | undefined,
  goodUp = true,
): string {
  if (n == null || n === 0) return "text-black-45";
  const bueno = n > 0 ? goodUp : !goodUp;
  return bueno ? "text-success" : "text-danger";
}

export function escenarioPct(parte: number, total: number): number {
  if (!total) return 0;
  return round1((parte / total) * 100);
}
