import { getAdvisorColor } from "@/lib/advisorColors";

interface FilaRanking {
  asesor: string;
  total: number;
  porcentaje: number;
  fcr: number | null;
  scoreGlobal: number;
  cumplimientoPrimeraRespuesta: number | null;
  cumplimientoResolucion: number | null;
}

const fmtNum = (n: number | null | undefined) => n == null ? "—" : n.toLocaleString("es-PE");
const fmtPct = (n: number | null | undefined) => n == null ? "—" : `${n.toLocaleString("es-PE")}%`;

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "#16a34a" : score >= 70 ? "#f59e0b" : "#dc2626";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-black-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums w-10 text-right" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function TrendBadge({ fcr }: { fcr: number | null }) {
  if (fcr == null) return <span className="text-black-25">—</span>;
  if (fcr >= 90) return <span className="text-success font-bold">▲</span>;
  if (fcr >= 70) return <span className="text-warning">—</span>;
  return <span className="text-danger font-bold">▼</span>;
}

function AdvisorDot({ name }: { name: string }) {
  const color = getAdvisorColor(name);
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: color }} />;
}

interface Props {
  items: FilaRanking[];
}

export function PerformanceRanking({ items }: Props) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5">
      <h3 className="text-sm font-medium text-black-85">Ranking de Performance</h3>
      <p className="mt-1 text-xs text-black-25">
        Score Global: 35% volumen · 25% SLA 1ª respuesta · 25% SLA resolución · 15% FCR.
        Ponderado por volumen de cada canal (WhatsApp + Correo).
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-xs uppercase tracking-wide text-black-45">
              <th className="pb-2 font-medium w-8">#</th>
              <th className="pb-2 font-medium">Asesor</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 text-right font-medium">Volumen</th>
              <th className="pb-2 text-right font-medium">SLA Espera</th>
              <th className="pb-2 text-right font-medium">SLA Resol.</th>
              <th className="pb-2 text-right font-medium">FCR</th>
              <th className="pb-2 text-center font-medium w-10">Tend.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, idx) => {
              return (
                <tr key={r.asesor} className="border-t border-black-5 transition-colors hover:bg-light">
                  <td className="py-2 text-black-45 font-medium">{idx + 1}</td>
                  <td className="py-2 text-black-85">
                    <span className="inline-flex items-center">
                      <AdvisorDot name={r.asesor} />
                      {r.asesor}
                    </span>
                  </td>
                  <td className="py-2">
                    <ScoreBar score={r.scoreGlobal} />
                  </td>
                  <td className="py-2 text-right text-black-85 tabular-nums">{fmtNum(r.total)}</td>
                  <td className="py-2 text-right text-black-85 tabular-nums">{fmtPct(r.cumplimientoPrimeraRespuesta)}</td>
                  <td className="py-2 text-right text-black-85 tabular-nums">{fmtPct(r.cumplimientoResolucion)}</td>
                  <td className={`py-2 text-right font-medium tabular-nums ${(r.fcr ?? 0) >= 80 ? "text-success" : (r.fcr ?? 0) >= 50 ? "text-warning" : "text-danger"}`}>
                    {fmtPct(r.fcr)}
                  </td>
                  <td className="py-2 text-center">
                    <TrendBadge fcr={r.fcr} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
