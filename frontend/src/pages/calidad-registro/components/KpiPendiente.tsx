import type { ReactNode } from "react";
import { fmtNum, fmtPct } from "../format";

interface Props {
  icon: ReactNode;
  titulo: string;
  cantidad: number;
  pct: number | null;
}

/**
 * Tarjeta secundaria de pendientes. No compite con los dos KPI principales.
 */
export function KpiPendiente({ icon, titulo, cantidad, pct }: Props) {
  const ancho = pct == null ? 0 : Math.max(0, Math.min(100, pct));

  return (
    <div className="rounded-2xl border border-black-10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">
            {titulo}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-orange-700">
            {fmtNum(cantidad)}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
          {icon}
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-light">
        <div
          className="h-full rounded-full bg-orange-400"
          style={{ width: `${ancho}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-black-45">{fmtPct(pct)} del total</p>
    </div>
  );
}
