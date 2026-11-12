import { cn } from "@/lib/utils";

export function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  // `fecha_solicitud` conserva el día original (YYYY-MM-DD o ISO UTC). Se
  // muestra la parte de fecha tal como está guardada, sin convertir de zona
  // horaria, para no desplazar el día del ticket.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  const d = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    : new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Fecha visible del expediente. Usa fecha_solicitud (origen del ticket) y,
 * si un registro histórico aún no la tiene, cae a created_at (incorporación)
 * para no mostrar un guion cuando sí existe una fecha almacenada.
 */
export function fechaCasoSolicitud(c: {
  fecha_solicitud?: string | null;
  created_at?: string | null;
}): string {
  return fmtFecha(c.fecha_solicitud ?? c.created_at);
}

export function fmtMoneda(v: number | null | undefined, moneda?: string | null): string {
  if (v == null) return "—";
  const mon = moneda === "USD" ? "USD" : "PEN";
  return v.toLocaleString("es-PE", { style: "currency", currency: mon });
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v}%`;
}

const badgeBase =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5";

function Dot({ className }: { className: string }) {
  return <span className={cn("h-1.5 w-1.5 rounded-full", className)} />;
}

export function EstadoBadge({ estado }: { estado: string | null }) {
  const e = (estado ?? "").trim().toLowerCase();
  const map: Record<string, { cls: string; dot: string }> = {
    "pendiente de conciliación": { cls: "border-warning-25 bg-warning-5 text-warning-65", dot: "bg-warning" },
    "pendiente de conciliacion": { cls: "border-warning-25 bg-warning-5 text-warning-65", dot: "bg-warning" },
    "en negociación": { cls: "border-primary-25 bg-primary-5 text-primary", dot: "bg-primary" },
    "en negociacion": { cls: "border-primary-25 bg-primary-5 text-primary", dot: "bg-primary" },
    "pendiente de aprobación": { cls: "border-yellow-25 bg-yellow-5 text-yellow-65", dot: "bg-yellow" },
    "pendiente de aprobacion": { cls: "border-yellow-25 bg-yellow-5 text-yellow-65", dot: "bg-yellow" },
    "resuelto": { cls: "border-success-25 bg-success-5 text-success", dot: "bg-success" },
    "cerrado": { cls: "border-black-10 bg-black-5 text-black-65", dot: "bg-black-45" },
    "abierto": { cls: "border-success-25 bg-success-5 text-success", dot: "bg-success" },
  };
  const cfg = map[e] ?? { cls: "border-black-10 bg-white text-black-45", dot: "bg-black-25" };
  return (
    <span className={cn(badgeBase, cfg.cls)}>
      <Dot className={cfg.dot} />
      {estado || "Sin estado"}
    </span>
  );
}

export function ResultadoBadge({ resultado }: { resultado: string | null }) {
  const r = (resultado ?? "").trim().toLowerCase();
  const map: Record<string, { cls: string; dot: string }> = {
    "no procede": { cls: "border-danger-25 bg-danger-5 text-danger", dot: "bg-danger" },
    "procede 100%": { cls: "border-success-25 bg-success-5 text-success", dot: "bg-success" },
    "procede parcialmente": { cls: "border-primary-25 bg-primary-5 text-primary", dot: "bg-primary" },
    "pendiente": { cls: "border-warning-25 bg-warning-5 text-warning-65", dot: "bg-warning" },
    "devuelto": { cls: "border-success-25 bg-success-5 text-success", dot: "bg-success" },
  };
  const cfg = map[r] ?? { cls: "border-black-10 bg-white text-black-45", dot: "bg-black-25" };
  return (
    <span className={cn(badgeBase, cfg.cls)}>
      <Dot className={cfg.dot} />
      {resultado || "Sin resultado"}
    </span>
  );
}

export function CasoAbiertoBadge({ cerrado }: { cerrado: boolean }) {
  return cerrado
    ? <span className={cn(badgeBase, "border-black-10 bg-black-5 text-black-65")}><Dot className="bg-black-45" /> CERRADO</span>
    : <span className={cn(badgeBase, "border-success-25 bg-success-5 text-success")}><Dot className="bg-success" /> ABIERTO</span>;
}

export function TipoBadge({ tipo }: { tipo: "queja" | "devolucion" }) {
  return tipo === "devolucion"
    ? <span className={cn(badgeBase, "border-purple-25 bg-purple-5 text-purple")}>Devolución</span>
    : <span className={cn(badgeBase, "border-primary-25 bg-primary-5 text-primary")}>Queja</span>;
}

export function OrigenBadge({ origen }: { origen: string | null }) {
  const o = (origen ?? "").toUpperCase();
  const cfg =
    o === "CATEGORIZACION" ? "border-primary-25 bg-primary-5 text-primary" :
    o === "BACKFILL" ? "border-aqua-25 bg-aqua-5 text-aqua" :
    o === "EXCEL_HISTORICO" ? "border-purple-25 bg-purple-5 text-purple" :
    "border-black-10 bg-black-5 text-black-45";
  const label =
    o === "CATEGORIZACION" ? "Automático" :
    o === "BACKFILL" ? "Carga histórica" :
    o === "EXCEL_HISTORICO" ? "Histórico" :
    o === "MANUAL" ? "Manual" : (origen || "—");
  return <span className={cn(badgeBase, cfg)}>{label}</span>;
}

export function SinDominioBadge() {
  return <span className={cn(badgeBase, "border-warning-25 bg-warning-5 text-warning-65")}>SIN DOMINIO</span>;
}
