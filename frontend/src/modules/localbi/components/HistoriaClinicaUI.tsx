import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function SeccionColapsable({ title, defaultOpen = false, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-black-10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[10px] font-medium text-black-45 hover:bg-light"
      >
        {open ? <ChevronDown size={12} className="shrink-0 text-black-25" /> : <ChevronRight size={12} className="shrink-0 text-black-25" />}
        <span className="uppercase tracking-wider">{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {open && <div className="px-2.5 pb-2">{children}</div>}
    </div>
  );
}

export function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="shrink-0 text-[9px] text-black-25">{label}</span>
      <span className="ml-2 max-w-[65%] truncate text-right text-[10px] font-medium text-black-85">{children}</span>
    </div>
  );
}

export function ND() {
  return <span className="text-black-10">—</span>;
}

export function SegmentoBadge({ segmento }: { segmento: string }) {
  const s = (segmento ?? "").toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    "HIGH TOUCH": { label: "High Touch", className: "bg-purple-5 text-purple" },
    "LOW TOUCH": { label: "Low Touch", className: "bg-aqua-5 text-aqua" },
    "TECH TOUCH": { label: "Tech Touch", className: "bg-black-5 text-black-65" },
  };
  const cfg = map[s] ?? { label: segmento || "—", className: "bg-black-5 text-black-45" };
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", cfg.className)}>{cfg.label}</span>;
}

export function EstadoLocalBadge({ estado }: { estado: string }) {
  const e = (estado ?? "").toUpperCase();
  const map: Record<string, string> = {
    ACTIVO: "bg-success-5 text-success",
    INACTIVO: "bg-black-5 text-black-65",
    CHURN: "bg-danger-5 text-danger",
    "SIN IMPLEMENTAR": "bg-warning-5 text-warning-65",
  };
  const cls = map[e] ?? "bg-black-5 text-black-45";
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", cls)}>{estado || "—"}</span>;
}

export function fmtMoneda(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

export function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

/** NPS con "—" para null/vacío (presentación, sin recálculo). */
export function fmtNps(v: number | null | undefined): string {
  return v != null ? String(v) : "—";
}

/** Normaliza un dominio para comparación (lowercase, trim, sin protocolo, sin trailing slash). */
export function normalizarDominio(d: string | null | undefined): string {
  if (!d) return "";
  return d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
}

/**
 * Nombre del local con fallback EXPLÍCITO: si no hay nombre, usa
 * `nombreFallback` (p. ej. de incidencias) si existe, y si no el subdominio
 * derivado, marcado visualmente. NO inventa nombres.
 */
export function nombreLocal(l: { nombre?: string | null; link_dominio?: string | null; dominio?: string }, nombreFallback?: string | null): React.ReactNode {
  if (l.nombre && String(l.nombre).trim()) return String(l.nombre);
  if (nombreFallback && String(nombreFallback).trim()) {
    return (
      <span className="text-black-85">
        {String(nombreFallback)}
        <span className="ml-0.5 text-[8px] italic text-black-25">(incidencias)</span>
      </span>
    );
  }
  const dom = normalizarDominio(l.link_dominio || l.dominio);
  if (!dom) return <ND />;
  const sub = dom.split(".")[0] || dom;
  return (
    <span className="text-black-65">
      {sub}
      <span className="ml-0.5 text-[8px] italic text-black-25">(del dominio)</span>
    </span>
  );
}
