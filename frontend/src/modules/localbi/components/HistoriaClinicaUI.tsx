import { createContext, useContext, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeDomain } from "@/domain/normalizacion";

export type HistoriaDensity = "compact" | "comfortable";

const HistoriaDensityContext = createContext<HistoriaDensity>("compact");

export function HistoriaDensityProvider({
  value,
  children,
}: {
  value: HistoriaDensity;
  children: React.ReactNode;
}) {
  return (
    <HistoriaDensityContext.Provider value={value}>
      {children}
    </HistoriaDensityContext.Provider>
  );
}

export function useHistoriaDensity(): HistoriaDensity {
  return useContext(HistoriaDensityContext);
}

interface Props {
  title: string;
  titleClassName?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function SeccionColapsable({ title, titleClassName, defaultOpen = false, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className="border-b border-black-10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center text-left hover:bg-light",
          comfortable
            ? "gap-2 px-4 py-3 text-[14px] font-semibold text-black-85"
            : "gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-black-45",
        )}
      >
        {open ? (
          <ChevronDown size={comfortable ? 16 : 12} className="shrink-0 text-black-45" />
        ) : (
          <ChevronRight size={comfortable ? 16 : 12} className="shrink-0 text-black-45" />
        )}
        <span className={cn(comfortable ? "" : "uppercase tracking-wider", titleClassName)}>{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {open && <div className={comfortable ? "px-4 pb-4" : "px-2.5 pb-2"}>{children}</div>}
    </div>
  );
}

export function Info({ label, children }: { label: string; children: React.ReactNode }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className={cn("flex items-center justify-between", comfortable ? "py-1.5" : "py-0.5")}>
      <span className={cn("shrink-0", comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25")}>
        {label}
      </span>
      <span
        className={cn(
          "ml-2 max-w-[65%] truncate text-right font-medium text-black-85",
          comfortable ? "text-[13px]" : "text-[10px]",
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function ND() {
  return <span className="text-black-10">—</span>;
}

export function SegmentoBadge({ segmento }: { segmento: string }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const s = (segmento ?? "").toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    "HIGH TOUCH": { label: "High Touch", className: "bg-purple-5 text-purple" },
    "LOW TOUCH": { label: "Low Touch", className: "bg-aqua-5 text-aqua" },
    "TECH TOUCH": { label: "Tech Touch", className: "bg-black-5 text-black-65" },
  };
  const cfg = map[s] ?? { label: segmento || "—", className: "bg-black-5 text-black-45" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function EstadoLocalBadge({ estado }: { estado: string }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const e = (estado ?? "").toUpperCase();
  const map: Record<string, string> = {
    ACTIVO: "bg-success-5 text-success",
    INACTIVO: "bg-black-5 text-black-65",
    CHURN: "bg-danger-5 text-danger",
    "SIN IMPLEMENTAR": "bg-warning-5 text-warning-65",
  };
  const cls = map[e] ?? "bg-black-5 text-black-45";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        cls,
      )}
    >
      {estado || "—"}
    </span>
  );
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

/** Normaliza un dominio a su forma canónica (solo hostname). Re-export de la fuente única. */
export const normalizarDominio = normalizeDomain;

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
