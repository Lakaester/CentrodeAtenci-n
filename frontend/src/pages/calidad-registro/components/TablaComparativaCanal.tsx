import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight } from "lucide-react";
import { Section } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct } from "../format";
import type { CalidadCanal, CalidadRegistroResponse } from "../types";

type SortKey = "canal" | "total" | "pctCat" | "pendCat" | "pctDom" | "pendDom";
type Dir = "asc" | "desc";

interface Row {
  canal: string;
  label: string;
  total: number;
  pctCat: number | null;
  pendCat: number;
  pctDom: number | null;
  pendDom: number;
  raw: CalidadCanal;
}

function colorRanking(
  value: number | null,
  max: number | null,
  min: number | null,
  higherIsBetter: boolean,
): string {
  if (value == null || max == null || min == null || max === min) return "text-black-85";
  if (higherIsBetter) {
    if (value === max) return "text-emerald-700";
    if (value === min) return "text-orange-700";
    return "text-black-85";
  }
  if (value === max) return "text-orange-700";
  if (value === min) return "text-emerald-700";
  return "text-black-85";
}

function barColor(
  value: number | null,
  max: number | null,
  min: number | null,
  higherIsBetter: boolean,
): string {
  if (value == null || max == null || min == null || max === min) return "bg-slate-400";
  if (higherIsBetter) {
    if (value === max) return "bg-emerald-500";
    if (value === min) return "bg-orange-400";
    return "bg-slate-400";
  }
  if (value === max) return "bg-orange-400";
  if (value === min) return "bg-emerald-500";
  return "bg-slate-400";
}

function Header({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: Dir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "cursor-pointer select-none whitespace-nowrap pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-black-45 hover:text-black-85",
        align === "right" && "text-right",
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end")}>
        {label}
        {current === sortKey ? (
          <span className="text-primary">{dir === "asc" ? "↑" : "↓"}</span>
        ) : (
          <ArrowDownUp size={11} className="opacity-40" />
        )}
      </span>
    </th>
  );
}

function PctCell({
  value,
  className,
  bar,
}: {
  value: number | null;
  className: string;
  bar: string;
}) {
  const ancho = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-[92px]">
      <p className={cn("text-right text-sm font-semibold tabular-nums", className)}>
        {fmtPct(value)}
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-light">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${ancho}%` }} />
      </div>
    </div>
  );
}

export function TablaComparativaCanal({
  data,
  onVerTodos,
}: {
  data: CalidadRegistroResponse;
  onVerTodos?: () => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("pctCat");
  const [dir, setDir] = useState<Dir>("desc");

  const rows: Row[] = data.comparativo.map((c) => ({
    canal: c.canal,
    label: c.canalLabel,
    total: c.total,
    pctCat: c.categorizacion.pctRegistrada,
    pendCat: c.categorizacion.noRegistradas,
    pctDom: c.dominio.pctInformado,
    pendDom: c.dominio.noInformados,
    raw: c,
  }));

  const conDatos = rows.filter((r) => r.total > 0);
  const maxPctCat = conDatos.length ? Math.max(...conDatos.map((r) => r.pctCat ?? -1)) : null;
  const minPctCat = conDatos.length ? Math.min(...conDatos.map((r) => r.pctCat ?? 101)) : null;
  const maxPctDom = conDatos.length ? Math.max(...conDatos.map((r) => r.pctDom ?? -1)) : null;
  const minPctDom = conDatos.length ? Math.min(...conDatos.map((r) => r.pctDom ?? 101)) : null;
  const maxPendCat = conDatos.length ? Math.max(...conDatos.map((r) => r.pendCat)) : null;
  const minPendCat = conDatos.length ? Math.min(...conDatos.map((r) => r.pendCat)) : null;
  const maxPendDom = conDatos.length ? Math.max(...conDatos.map((r) => r.pendDom)) : null;
  const minPendDom = conDatos.length ? Math.min(...conDatos.map((r) => r.pendDom)) : null;

  const sorted = useMemo(() => {
    const value = (r: Row): string | number | null => {
      if (sortKey === "canal") return r.label;
      if (sortKey === "total") return r.total;
      if (sortKey === "pctCat") return r.pctCat;
      if (sortKey === "pendCat") return r.pendCat;
      if (sortKey === "pctDom") return r.pctDom;
      return r.pendDom;
    };
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [rows, sortKey, dir]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir(k === "canal" ? "asc" : "desc");
    }
  };

  if (!rows.length) {
    return (
      <Section title="Comparativo por canal">
        <p className="py-8 text-center text-sm text-black-25">
          No hay canales con datos para el rango seleccionado.
        </p>
      </Section>
    );
  }

  return (
    <Section
      title="Comparativo por canal"
      subtitle="Verde = mejor cumplimiento relativo · Naranja = mayor pendiente. Ordena haciendo clic en los encabezados."
    >
      {rows.length < 3 && onVerTodos && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black-10 bg-light/70 px-3 py-2">
          <p className="text-xs text-black-45">
            El filtro de canal está activo. Para comparar los tres canales, restablece el filtro.
          </p>
          <button
            onClick={onVerTodos}
            className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-white"
          >
            Ver los 3 canales <ArrowRight size={13} />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-white">
            <tr>
              <Header label="Canal" sortKey="canal" current={sortKey} dir={dir} onSort={onSort} align="left" />
              <Header label="Total atenciones" sortKey="total" current={sortKey} dir={dir} onSort={onSort} />
              <Header label="% Categorizadas" sortKey="pctCat" current={sortKey} dir={dir} onSort={onSort} />
              <Header label="Pend. categorizar" sortKey="pendCat" current={sortKey} dir={dir} onSort={onSort} />
              <Header label="% Con dominio" sortKey="pctDom" current={sortKey} dir={dir} onSort={onSort} />
              <Header label="Pend. dominio" sortKey="pendDom" current={sortKey} dir={dir} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.canal} className="border-t border-black-5 hover:bg-light/60">
                <td className="py-3 pr-4">
                  <span className="rounded-md border border-primary/20 bg-primary-10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {r.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-black-85">
                  {fmtNum(r.total)}
                </td>
                <td className="py-3 pr-4">
                  <PctCell
                    value={r.pctCat}
                    className={colorRanking(r.pctCat, maxPctCat, minPctCat, true)}
                    bar={barColor(r.pctCat, maxPctCat, minPctCat, true)}
                  />
                </td>
                <td
                  className={cn(
                    "py-3 pr-4 text-right font-semibold tabular-nums",
                    colorRanking(r.pendCat, maxPendCat, minPendCat, false),
                  )}
                >
                  {fmtNum(r.pendCat)}
                </td>
                <td className="py-3 pr-4">
                  <PctCell
                    value={r.pctDom}
                    className={colorRanking(r.pctDom, maxPctDom, minPctDom, true)}
                    bar={barColor(r.pctDom, maxPctDom, minPctDom, true)}
                  />
                </td>
                <td
                  className={cn(
                    "py-3 pr-4 text-right font-semibold tabular-nums",
                    colorRanking(r.pendDom, maxPendDom, minPendDom, false),
                  )}
                >
                  {fmtNum(r.pendDom)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-black-25">
        La suma de canales puede superar el total consolidado por tickets Meta/Whaticket
        duplicados. Cada fila cumple: pendientes = total − cumplidas.
      </p>
    </Section>
  );
}
