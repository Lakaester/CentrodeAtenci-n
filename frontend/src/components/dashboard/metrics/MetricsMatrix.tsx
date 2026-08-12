import { useMemo } from "react";
import { Info } from "lucide-react";
import { MetricsHeatCell } from "./MetricsHeatCell";

interface RowDef {
  label: string;
  tooltip?: string;
  getValue: (r: Record<string, any>) => number | null;
  getPct?: (r: Record<string, any>) => number | null;
  fmt: (v: number | null) => string | null;
  variant: "count" | "time" | "sla";
  slaLevel?: number;
}

interface Props {
  title: string;
  subtitle: string;
  filas: Record<string, any>[];
  totales: Record<string, any>;
  canal: "wpp" | "corr";
  getName: (r: Record<string, any>) => string;
}

const C = (n: number | null) => n ?? 0;

const THRESHOLDS_SLA: Record<string, { espera: string[]; atencion: string[] }> = {
  wpp: {
    espera: ["(Meta) ≤15 min", "16–60 min", "1–3 h", "3–24 h", ">24 h"],
    atencion: ["≤20 min", "21–40 min", "41–60 min", "61–120 min", ">120 min"],
  },
  corr: {
    espera: ["≤6 h", "≤12 h", "(Meta) ≤24 h", "≤48 h", ">48 h"],
    atencion: ["≤6 h", "≤12 h", "≤24 h", "≤48 h", ">48 h"],
  },
};

const fmtNum = (v: number | null) =>
  v != null ? v.toLocaleString("es-PE") : null;

const fmtMin = (v: number | null) =>
  v != null ? `${v.toFixed(1)} min` : null;
const fmtHour = (v: number | null) =>
  v != null ? `${(v / 60).toFixed(1)} h` : null;

export function MetricsMatrix({ title, subtitle, filas, totales, canal, getName }: Props) {
  const names = useMemo(() => filas.map((f) => getName(f)), [filas, getName]);
  const sla = THRESHOLDS_SLA[canal];
  const prefix = canal === "wpp" ? "wpp" : "corr";
  const isCorreo = canal === "corr";
  const fmtTime = isCorreo ? fmtHour : fmtMin;

  const sections = useMemo(() => {
    const s: { label: string; rows: RowDef[] }[] = [];

    const atencionRows: RowDef[] = [
      {
        label: "No cerradas",
        tooltip: "Representa tickets cuyo estado ACTUAL no es 'cerrado'. Para periodos historicos este valor no corresponde al estado que tenia el ticket durante ese periodo, ya que actualmente el backend no dispone de snapshots historicos.",
        getValue: (r) => C(r[`${prefix}_en_proceso`]),
        variant: "count",
        fmt: fmtNum,
      },
      { label: "At. cerradas", getValue: (r) => C(r[`${prefix}_cerradas`]), variant: "count", fmt: fmtNum },
      { label: "At. atendidas", getValue: (r) => C(r[`${prefix}_en_proceso`]) + C(r[`${prefix}_cerradas`]), variant: "count", fmt: fmtNum },
    ];
    s.push({ label: "ATENCIONES", rows: atencionRows });

    s.push({
      label: isCorreo ? "TIEMPOS (HORAS)" : "TIEMPOS (min)",
      rows: [
        { label: "AVG T. Espera", getValue: (r) => { const v = r[`${prefix}_avg_espera`]; return v != null ? Number(v) : null; }, variant: "time", fmt: fmtTime },
        { label: "AVG T. Atención", getValue: (r) => { const v = r[`${prefix}_avg_atencion`]; return v != null ? Number(v) : null; }, variant: "time", fmt: fmtTime },
        { label: "AVG T. Total", getValue: (r) => { const v = r[`${prefix}_avg_total`]; return v != null ? Number(v) : null; }, variant: "time", fmt: fmtTime },
        { label: "Calificación", getValue: () => null, variant: "count", fmt: () => "—" },
      ],
    });

    const slaEspRows: RowDef[] = [];
    for (let i = 1; i <= 5; i++) {
      const suf = canal === "wpp" ? "esp" : "pr";
      const key = `${prefix}_sla_${suf}_${i}`;
      const totalKey = `${prefix}_sla_${suf}_t`;
      slaEspRows.push({
        label: `Q${i} ${sla.espera[i - 1]}`,
        getValue: (row) => C(row[key]),
        getPct: (row) => {
          const t = C(row[totalKey]);
          return t > 0 ? C(row[key]) / t : 0;
        },
        variant: "sla",
        slaLevel: i,
        fmt: (v) => fmtNum(v),
      });
    }
    s.push({ label: canal === "wpp" ? "SLA ESPERA" : "SLA PRIMERA RESPUESTA", rows: slaEspRows });

    const slaAteRows: RowDef[] = [];
    for (let i = 1; i <= 5; i++) {
      const key = `${prefix}_sla_ate_${i}`;
      const totalKey = `${prefix}_sla_ate_t`;
      slaAteRows.push({
        label: `Q${i} ${sla.atencion[i - 1]}`,
        getValue: (row) => C(row[key]),
        getPct: (row) => {
          const t = C(row[totalKey]);
          return t > 0 ? C(row[key]) / t : 0;
        },
        variant: "sla",
        slaLevel: i,
        fmt: (v) => fmtNum(v),
      });
    }
    s.push({ label: "SLA ATENCIÓN", rows: slaAteRows });

    return s;
  }, [canal, prefix, sla, isCorreo, fmtTime]);

  const allRows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);

  const maxPerRow = useMemo(() => {
    const all = [totales, ...filas];
    return allRows.map((r) => {
      if (r.variant === "time" || r.variant === "sla") return null;
      return Math.max(...all.map((f) => r.getValue(f) ?? 0));
    });
  }, [allRows, filas, totales]);

  const slaVariant = (level: number) => {
    if (level <= 1) return "green" as const;
    if (level <= 2) return "emerald" as const;
    if (level <= 3) return "yellow" as const;
    if (level <= 4) return "orange" as const;
    return "red" as const;
  };

  const totalCols = 1 + names.length + 1;

  return (
    <div className="rounded-2xl border border-black-10 bg-white ">
      <div className="border-b border-black-10 px-4 py-3">
        <h3 className="text-xs font-semibold text-black-85">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[10px] text-black-25">{subtitle}</p>}
      </div>
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="sticky left-0 z-30 bg-white border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45 min-w-[150px]">
                Indicador
              </th>
              {names.map((n) => (
                <th key={n} className="border-r border-black-10 px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 last:border-r-0 min-w-[85px]">
                  {n}
                </th>
              ))}
              <th className="border-r border-black-10 px-2 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-primary bg-orange-50 min-w-[85px]">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let flatIdx = 0;
              return sections.map((section) => {
                const rows = section.rows;
                const result = [
                  <tr key={`sec-${section.label}`} className="bg-dark">
                    <td colSpan={totalCols} className="px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                      {section.label}
                    </td>
                  </tr>,
                  ...rows.map((row) => {
                    const ri = flatIdx++;
                    const even = ri % 2 === 1;
                    const renderCell = (fila: Record<string, any>) => {
                      const val = row.getValue(fila);
                      const pct = row.getPct?.(fila);
                      const maxV = maxPerRow[ri];
                      const intensity = row.variant === "count" && maxV != null && maxV > 0
                        ? (val ?? 0) / maxV
                        : row.variant === "time"
                          ? 0.3
                          : pct ?? 0;
                      const variantForCell = row.variant === "sla" && row.slaLevel
                        ? slaVariant(row.slaLevel)
                        : "neutral" as const;
                      return (
                        <MetricsHeatCell
                          key={getName(fila)}
                          value={
                            pct != null && row.fmt(val) != null
                              ? `${row.fmt(val)} (${(pct * 100).toFixed(1)}%)`
                              : row.fmt(val)
                          }
                          intensity={intensity}
                          variant={variantForCell}
                        />
                      );
                    };
                    return (
                      <tr
                        key={row.label}
                        className={`transition-colors hover:bg-light ${even ? "bg-light" : ""}`}
                      >
                        <td
                          className="sticky left-0 z-10 border-r border-black-5 px-2 py-1 text-[11px] text-[#475569]"
                          style={{ backgroundColor: even ? "#FAFBFC" : "#FFF" }}
                        >
                          {row.label}
                          {row.tooltip && (
                            <span title={row.tooltip} className="inline-flex ml-1 cursor-help">
                              <Info size={10} className="text-black-25" />
                            </span>
                          )}
                        </td>
                        {filas.map((f) => renderCell(f))}
                        {renderCell(totales)}
                      </tr>
                    );
                  }),
                ];
                return result;
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
