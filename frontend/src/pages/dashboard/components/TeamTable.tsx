import { ArrowUpRight } from "lucide-react";
import type { AsesorGerencial } from "../dto/dashboard.dto";
import { fmtInt, fmtMin, fmtPct } from "../utils/format";
import { cn } from "@/lib/utils";

interface Props {
  rows: AsesorGerencial[];
  onSelect?: (asesor: string) => void;
}

function slaTone(pct: number | null): string {
  if (pct == null) return "text-black-25";
  if (pct >= 90) return "text-success";
  if (pct >= 80) return "text-warning";
  return "text-danger";
}

function SlaCell({ pct, dentro, evaluados }: { pct: number | null; dentro: number; evaluados: number }) {
  return (
    <div className="min-w-[92px]">
      <div className="flex items-baseline justify-between gap-1">
        <span className={cn("text-[11px] font-semibold tabular-nums", slaTone(pct))}>{fmtPct(pct)}</span>
        <span className="text-[9px] text-black-25">
          {fmtInt(dentro)}/{fmtInt(evaluados)}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-black-5">
        <div
          className={cn(
            "h-full rounded-full",
            pct == null ? "bg-black-10" : pct >= 90 ? "bg-success" : pct >= 80 ? "bg-warning" : "bg-danger",
          )}
          style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
        />
      </div>
    </div>
  );
}

export function TeamTable({ rows, onSelect }: Props) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-black-25">Sin actividad de asesores para los filtros aplicados.</p>;
  }

  const total = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black-45">
              <th className="sticky left-0 z-10 border-b border-black-5 bg-white px-2 py-2">Asesor</th>
              <th className="border-b border-black-5 px-2 py-2 text-right">Atenciones</th>
              <th className="border-b border-black-5 px-2 py-2 text-right">Pendientes</th>
              <th className="border-b border-black-5 px-2 py-2 text-right">1ª respuesta</th>
              <th className="border-b border-black-5 px-2 py-2 text-right">Solución</th>
              <th className="border-b border-black-5 px-2 py-2">SLA 1ª respuesta</th>
              <th className="border-b border-black-5 px-2 py-2">SLA resolución</th>
              <th className="border-b border-black-5 px-2 py-2 text-right">Efectividad</th>
              <th className="border-b border-black-5 px-2 py-2 text-right">Reincidencias</th>
              <th className="border-b border-black-5 px-2 py-2">Carga relativa</th>
              {onSelect && <th className="border-b border-black-5 px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const share = total > 0 ? (r.total / total) * 100 : 0;
              return (
                <tr
                  key={r.asesor}
                  className={cn("group text-[11px] text-black-85", onSelect && "cursor-pointer hover:bg-black-5")}
                  onClick={onSelect ? () => onSelect(r.asesor) : undefined}
                >
                  <td className="sticky left-0 z-10 border-b border-black-5 bg-white px-2 py-2 font-semibold text-black-85 group-hover:bg-black-5">
                    {r.asesor}
                  </td>
                  <td className="border-b border-black-5 px-2 py-2 text-right tabular-nums">
                    <span className="font-semibold text-black-85">{fmtInt(r.total)}</span>
                    <span className="ml-1 text-[9px] text-black-25">{share.toFixed(1)}%</span>
                  </td>
                  <td className="border-b border-black-5 px-2 py-2 text-right tabular-nums">
                    <span className={r.pendientes > 0 ? "font-semibold text-warning" : "text-black-25"}>
                      {fmtInt(r.pendientes)}
                    </span>
                  </td>
                  <td className="border-b border-black-5 px-2 py-2 text-right tabular-nums">{fmtMin(r.primera)}</td>
                  <td className="border-b border-black-5 px-2 py-2 text-right tabular-nums">{fmtMin(r.solucion)}</td>
                  <td className="border-b border-black-5 px-2 py-2">
                    <SlaCell pct={r.slaPrimeraPct} dentro={r.slaPrimeraDentro} evaluados={r.slaPrimeraEvaluados} />
                  </td>
                  <td className="border-b border-black-5 px-2 py-2">
                    <SlaCell
                      pct={r.slaResolucionPct}
                      dentro={r.slaResolucionDentro}
                      evaluados={r.slaResolucionEvaluados}
                    />
                  </td>
                  <td className="border-b border-black-5 px-2 py-2 text-right tabular-nums">
                    <span className={cn(r.efectividadPct != null && r.efectividadPct < 90 && "text-warning")}>
                      {fmtPct(r.efectividadPct)}
                    </span>
                  </td>
                  <td className="border-b border-black-5 px-2 py-2 text-right tabular-nums">{fmtInt(r.reincidencias)}</td>
                  <td className="border-b border-black-5 px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black-5">
                        <div
                          className="h-full rounded-full bg-black-85"
                          style={{ width: `${Math.max(4, Math.min(100, r.cargaRelativa))}%` }}
                        />
                      </div>
                      <span className="text-[9px] tabular-nums text-black-45">{r.cargaRelativa.toFixed(0)}%</span>
                    </div>
                  </td>
                  {onSelect && (
                    <td className="border-b border-black-5 px-2 py-2 text-right">
                      <ArrowUpRight size={13} className="text-black-25 group-hover:text-primary" />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-black-25">
        La carga relativa compara volumen dentro del periodo. No se calcula un score único de desempeño: un asesor con
        más casos puede tener mejor performance relativa. Al hacer clic en una fila se filtra el dashboard por ese asesor.
      </p>
    </div>
  );
}
