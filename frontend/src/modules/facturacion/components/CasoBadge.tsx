import { cn } from "@/lib/utils";

const ESTADOS_CLS: Record<string, { label: string; cls: string }> = {
  PENDIENTE: { label: "Pendiente", cls: "bg-black-5 text-black-65" },
  ASIGNADO: { label: "Asignado", cls: "bg-primary-10 text-primary" },
  EN_DIAGNOSTICO: { label: "En diagnóstico", cls: "bg-primary-5 text-primary" },
  EN_SOLUCION: { label: "En solución", cls: "bg-purple-5 text-purple" },
  PAUSADO: { label: "Pausado", cls: "bg-warning-5 text-warning-65" },
  RESUELTO: { label: "Resuelto", cls: "bg-success-5 text-success" },
  NO_RESUELTO: { label: "No resuelto", cls: "bg-danger-5 text-danger" },
  DERIVADO: { label: "Derivado", cls: "bg-purple-5 text-purple" },
  CANCELADO: { label: "Cancelado", cls: "bg-black-5 text-black-65" },
};

export function CasoBadge({ estado, className }: { estado: string | null | undefined; className?: string }) {
  const e = ESTADOS_CLS[estado ?? ""] ?? { label: estado || "—", cls: "bg-black-5 text-black-45" };
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", e.cls, className)}>
      {e.label}
    </span>
  );
}

/** Estados considerados "activos" (aparecen en Encolados). */
export const ESTADOS_ACTIVOS = ["PENDIENTE", "ASIGNADO", "EN_DIAGNOSTICO", "EN_SOLUCION", "PAUSADO"];
