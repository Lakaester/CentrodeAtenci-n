import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct } from "../format";

interface Props {
  icon: ReactNode;
  titulo: string;
  pct: number | null;
  cantidad: number;
  total: number;
  pendientes: number;
  deltaPp: number | null;
}

/**
 * Tarjeta principal del dashboard ejecutivo.
 * El porcentaje es el protagonista; el conteo y los pendientes son contexto.
 */
export function KpiPrincipal({
  icon,
  titulo,
  pct,
  cantidad,
  total,
  pendientes,
  deltaPp,
}: Props) {
  const ancho = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const DeltaIcon = deltaPp == null || deltaPp === 0 ? Minus : deltaPp > 0 ? ArrowUp : ArrowDown;
  const deltaColor =
    deltaPp == null || deltaPp === 0
      ? "text-black-45"
      : deltaPp > 0
        ? "text-success"
        : "text-danger";

  return (
    <div className="rounded-2xl border border-black-10 bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-black-45">{titulo}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-700">
            {fmtPct(pct)}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-light">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${ancho}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-black-45">
          <span className="font-semibold text-black-85">{fmtNum(cantidad)}</span> de{" "}
          {fmtNum(total)} atenciones
        </p>
        <span
          className={cn("inline-flex items-center gap-1 text-xs font-semibold", deltaColor)}
        >
          <DeltaIcon size={13} />
          {deltaPp == null
            ? "Sin comparativo"
            : `${deltaPp > 0 ? "+" : ""}${deltaPp.toFixed(1)} pp`}
          <span className="font-normal text-black-25">vs periodo anterior</span>
        </span>
      </div>

      <p className="mt-2 text-xs font-medium text-orange-700">
        {fmtNum(pendientes)} pendientes
      </p>
    </div>
  );
}
