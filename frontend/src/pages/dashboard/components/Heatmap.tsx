import { useMemo } from "react";
import { CHART, hexToRgba } from "@/lib/chartPalette";

interface Props {
  data: { dia: number; hora: number; total: number }[];
}

const DAYS = [
  { idx: 1, label: "Lun" },
  { idx: 2, label: "Mar" },
  { idx: 3, label: "Mié" },
  { idx: 4, label: "Jue" },
  { idx: 5, label: "Vie" },
  { idx: 6, label: "Sáb" },
  { idx: 0, label: "Dom" },
];

export function Heatmap({ data }: Props) {
  const { map, max } = useMemo(() => {
    const m = new Map<string, number>();
    let mx = 0;
    for (const d of data) {
      m.set(`${d.dia}-${d.hora}`, d.total);
      if (d.total > mx) mx = d.total;
    }
    return { map: m, max: mx };
  }, [data]);

  if (data.length === 0) {
    return <p className="py-8 text-center text-xs text-black-25">Sin registros para los filtros aplicados.</p>;
  }

  const color = (value: number) => {
    if (value <= 0) return CHART.split;
    const alpha = 0.1 + 0.85 * (value / Math.max(1, max));
    return hexToRgba(CHART.brand, Number(alpha.toFixed(3)));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={`h-${h}`} className="text-center text-[9px] font-medium text-black-25">
                {String(h).padStart(2, "0")}
              </div>
            ))}
            {DAYS.map((d) => (
              <div key={`row-${d.idx}`} className="contents">
                <div className="flex items-center text-[9px] font-semibold uppercase tracking-wide text-black-45">
                  {d.label}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const value = map.get(`${d.idx}-${h}`) ?? 0;
                  return (
                    <div
                      key={`${d.idx}-${h}`}
                      title={`${d.label} ${String(h).padStart(2, "0")}:00 — ${value} atención${value === 1 ? "" : "es"}`}
                      className="h-5 rounded-[3px] border border-white/60 transition-transform hover:scale-110"
                      style={{ backgroundColor: color(value) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[9px] text-black-25">
        <span>Menos</span>
        <div className="flex gap-0.5">
          {[0.08, 0.25, 0.45, 0.65, 0.9].map((a) => (
            <span
              key={a}
              className="h-2.5 w-4 rounded-sm"
              style={{ backgroundColor: hexToRgba(CHART.brand, a) }}
            />
          ))}
        </div>
        <span>Más</span>
        <span className="ml-2 rounded bg-black-5 px-1.5 py-0.5">Máx: {max}</span>
      </div>
    </div>
  );
}
