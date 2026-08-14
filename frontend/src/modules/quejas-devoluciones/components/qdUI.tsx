import { cn } from "@/lib/utils";

export function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtMoneda(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v}%`;
}

export function EstadoBadge({ estado }: { estado: string | null }) {
  const e = (estado ?? "").toLowerCase();
  const map: Record<string, string> = {
    "pendiente de conciliación": "bg-warning-5 text-warning-65",
    "en negociación": "bg-primary-5 text-primary",
    "pendiente de aprobación": "bg-yellow-5 text-yellow",
    "resuelto": "bg-success-5 text-success",
  };
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", map[e] ?? "bg-black-5 text-black-45")}>{estado || "—"}</span>;
}

export function ResultadoBadge({ resultado }: { resultado: string | null }) {
  const r = (resultado ?? "").toLowerCase();
  const map: Record<string, string> = {
    "no procede": "bg-danger-5 text-danger",
    "procede 100%": "bg-success-5 text-success",
    "procede parcialmente": "bg-primary-5 text-primary",
    "pendiente": "bg-warning-5 text-warning-65",
  };
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", map[r] ?? "bg-black-5 text-black-45")}>{resultado || "—"}</span>;
}
