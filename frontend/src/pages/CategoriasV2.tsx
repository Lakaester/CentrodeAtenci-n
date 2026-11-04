import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Medal,
  Tags,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, fmtPct, fmtDur, KpiCard, Section } from "@/components/dashboard/shared";

/* ─── Tipos ─── */
interface CategoriasV2Response {
  universo: {
    total: number;
    totalRango: number;
    excluidas: number;
    abiertas: number;
    sinEstado: number;
  };
  totalCategorias: number;
  totalSubcategorias: number;
  categoriaLider: { nombre: string; volumen: number } | null;
  subcategoriaLider: { nombre: string; volumen: number } | null;
  paretoCategorias: {
    categoria: string;
    volumen: number;
    pct: number;
    acumulado: number;
    tecnica: boolean;
  }[];
  paretoSubcategorias: {
    categoria: string;
    subcategoria: string;
    volumen: number;
  }[];
  jerarquia: { categoria: string; subcategoria: string; dominio: string; volumen: number }[];
  categoriasTiempo: {
    categoria: string;
    volumen: number;
    conDato: number;
    tiempo_atencion: number | null;
    tecnica: boolean;
  }[];
  categoriasSLA: {
    categoria: string;
    volumen: number;
    conDato: number;
    cumple: number;
    noCumple: number;
    pctCumple: number | null;
    pctIncumple: number | null;
    tecnica: boolean;
  }[];
  slaMetas: { whatsapp: number; correo: number; otro: number };
  asesorDetalle: { asesor: string; categoria: string; subcategoria: string; volumen: number }[];
  asesorTrazabilidad: { original: string; consolidado: string; volumen: number }[];
  totalSinAsesor: number;
}

async function fetchData(params: Record<string, string>): Promise<CategoriasV2Response> {
  const { data } = await api.get("/dashboard/categorias-v2", { params });
  return data.data as CategoriasV2Response;
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

const fmt1 = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-PE", { maximumFractionDigits: 1 });
const fmtPct1 = (n: number | null | undefined) => (n == null ? "—" : `${fmt1(n)}%`);

const TECNICAS = ["SIN HOMOLOGAR", "SIN CATEGORIA EN ORIGEN", "SIN CATEGORÍA EN ORIGEN"];
const esTecnica = (categoria: string) => TECNICAS.includes(categoria.toUpperCase());

/* ════════════════════════════════════════════════════════════════ */
/*  PARETO (categorías y subcategorías contextuales)               */
/* ════════════════════════════════════════════════════════════════ */
interface ParetoItem {
  label: string;
  volumen: number;
  pct: number;
  acumulado: number;
  tecnica: boolean;
}

function ParetoChart({
  items,
  height = 380,
  maxItems,
}: {
  items: ParetoItem[];
  height?: number;
  maxItems?: number;
}) {
  const primary = cssVar("--primary", "#F97316");
  const muted = cssVar("--muted", "#64748B");
  const border = cssVar("--border", "#E5E7EB");
  const top = maxItems ? items.slice(0, maxItems) : items;

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params: any) => {
        const i = top[params?.[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.label}</b>`,
          `Atenciones: <b>${fmtNum(i.volumen)}</b>`,
          `Participación: ${fmtPct1(i.pct)}`,
          `Acumulado: ${fmtPct1(i.acumulado)}`,
          i.tecnica ? "<span style='color:#94a3b8'>Categoría técnica</span>" : "",
        ]
          .filter(Boolean)
          .join("<br/>");
      },
    },
    grid: { left: 58, right: 58, top: 30, bottom: top.length > 8 ? 96 : 62 },
    xAxis: {
      type: "category",
      data: top.map((i) => i.label),
      axisLabel: {
        color: muted,
        fontSize: 10,
        interval: 0,
        rotate: top.length > 8 ? 38 : 0,
        width: 110,
        overflow: "truncate",
      },
      axisLine: { lineStyle: { color: border } },
    },
    yAxis: [
      {
        type: "value",
        name: "Atenciones",
        nameTextStyle: { color: muted, fontSize: 10 },
        axisLabel: {
          color: muted,
          fontSize: 10,
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
        },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      {
        type: "value",
        name: "% acumulado",
        max: 100,
        min: 0,
        nameTextStyle: { color: muted, fontSize: 10 },
        axisLabel: { color: muted, fontSize: 10, formatter: "{value}%" },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Atenciones",
        type: "bar",
        barMaxWidth: 28,
        data: top.map((i) => ({
          value: i.volumen,
          itemStyle: { color: i.tecnica ? "#94a3b8" : primary, borderRadius: [3, 3, 0, 0] },
        })),
        label: {
          show: true,
          position: "top",
          color: muted,
          fontSize: 9,
          formatter: (p: any) => (p.value ? fmtNum(p.value) : ""),
        },
      },
      {
        name: "% acumulado",
        type: "line",
        yAxisIndex: 1,
        data: top.map((i) => i.acumulado),
        symbol: "circle",
        symbolSize: 5,
        smooth: false,
        lineStyle: { color: "#ef4444", width: 2 },
        itemStyle: { color: "#ef4444" },
        label: {
          show: top.length <= 10,
          position: "top",
          color: "#ef4444",
          fontSize: 9,
          formatter: (p: any) => `${p.value}%`,
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#ef4444", type: "dashed", width: 1 },
          label: {
            formatter: "80%",
            position: "insideEndTop",
            color: "#ef4444",
            fontSize: 9,
          },
          data: [{ yAxis: 80 }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  RANKING DE TIEMPO DE RESOLUCIÓN                                */
/* ════════════════════════════════════════════════════════════════ */
function RankingTiempo({ items }: { items: CategoriasV2Response["categoriasTiempo"] }) {
  const primary = cssVar("--primary", "#F97316");
  const muted = cssVar("--muted", "#64748B");
  const border = cssVar("--border", "#E5E7EB");
  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.tiempo_atencion ?? -1) - (a.tiempo_atencion ?? -1)),
    [items],
  );

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const r = sorted[params?.[0]?.dataIndex];
        if (!r) return "";
        return [
          `<b>${r.categoria}</b>`,
          `Tiempo promedio: <b>${fmtDur(r.tiempo_atencion)}</b>`,
          `Atenciones: ${fmtNum(r.volumen)}`,
          `Con tiempo registrado: ${fmtNum(r.conDato)}`,
          r.tecnica ? "<span style='color:#94a3b8'>Categoría técnica</span>" : "",
        ]
          .filter(Boolean)
          .join("<br/>");
      },
    },
    grid: { left: 176, right: 96, top: 8, bottom: 24 },
    xAxis: {
      type: "value",
      axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => fmtDur(v) },
      splitLine: { lineStyle: { color: border, type: "dashed" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: sorted.map((r) => r.categoria),
      axisLabel: { color: muted, fontSize: 10, width: 160, overflow: "truncate" },
      axisLine: { lineStyle: { color: border } },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 16,
        data: sorted.map((r) => ({
          value: r.tiempo_atencion ?? 0,
          itemStyle: {
            color: r.tecnica ? "#94a3b8" : primary,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: muted,
          fontSize: 9,
          formatter: (p: any) => {
            const r = sorted[p.dataIndex];
            return r?.tiempo_atencion == null
              ? "—"
              : `${fmtDur(r.tiempo_atencion)} · ${fmtNum(r.conDato)}`;
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(240, sorted.length * 26 + 30) }}
      notMerge
      lazyUpdate
    />
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  RANKING DE INCUMPLIMIENTO SLA                                  */
/* ════════════════════════════════════════════════════════════════ */
function RankingSLA({ items }: { items: CategoriasV2Response["categoriasSLA"] }) {
  const muted = cssVar("--muted", "#64748B");
  const border = cssVar("--border", "#E5E7EB");
  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.pctIncumple ?? -1) - (a.pctIncumple ?? -1)),
    [items],
  );

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const r = sorted[params?.[0]?.dataIndex];
        if (!r) return "";
        return [
          `<b>${r.categoria}</b>`,
          `Incumplimiento: <b>${fmtPct1(r.pctIncumple)}</b>`,
          `Incumplen: ${fmtNum(r.noCumple)} de ${fmtNum(r.conDato)} evaluables`,
          `Cumplen: ${fmtNum(r.cumple)} (${fmtPct1(r.pctCumple)})`,
          r.tecnica ? "<span style='color:#94a3b8'>Categoría técnica</span>" : "",
        ]
          .filter(Boolean)
          .join("<br/>");
      },
    },
    grid: { left: 176, right: 116, top: 8, bottom: 24 },
    xAxis: {
      type: "value",
      max: 100,
      axisLabel: { color: muted, fontSize: 10, formatter: "{value}%" },
      splitLine: { lineStyle: { color: border, type: "dashed" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: sorted.map((r) => r.categoria),
      axisLabel: { color: muted, fontSize: 10, width: 160, overflow: "truncate" },
      axisLine: { lineStyle: { color: border } },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 16,
        data: sorted.map((r) => ({
          value: r.pctIncumple ?? 0,
          itemStyle: {
            color: r.tecnica ? "#94a3b8" : "#ef4444",
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: muted,
          fontSize: 9,
          formatter: (p: any) => {
            const r = sorted[p.dataIndex];
            if (!r || r.pctIncumple == null) return "—";
            return `${fmtPct1(r.pctIncumple)} · ${fmtNum(r.noCumple)}/${fmtNum(r.conDato)}`;
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(240, sorted.length * 26 + 30) }}
      notMerge
      lazyUpdate
    />
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  ANÁLISIS POR ASESOR                                            */
/* ════════════════════════════════════════════════════════════════ */
function AnalisisAsesor({ data }: { data: CategoriasV2Response }) {
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");

  const categorias = data.paretoCategorias.map((r) => r.categoria);

  const subcategorias = useMemo(() => {
    if (!cat) return [];
    const vistos = new Map<string, number>();
    for (const r of data.paretoSubcategorias) {
      if (r.categoria !== cat) continue;
      vistos.set(r.subcategoria, (vistos.get(r.subcategoria) ?? 0) + r.volumen);
    }
    return [...vistos.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [cat, data.paretoSubcategorias]);

  const filas = useMemo(() => {
    const filtrado = data.asesorDetalle.filter(
      (r) => (!cat || r.categoria === cat) && (!sub || r.subcategoria === sub),
    );
    const total = filtrado.reduce((s, r) => s + r.volumen, 0);
    const mapa = new Map<string, number>();
    for (const r of filtrado) mapa.set(r.asesor, (mapa.get(r.asesor) ?? 0) + r.volumen);
    const orden = [...mapa.entries()]
      .map(([asesor, volumen]) => ({
        asesor,
        volumen,
        pct: total > 0 ? (volumen / total) * 100 : 0,
      }))
      .sort((a, b) => b.volumen - a.volumen);
    return {
      total,
      oficiales: orden.filter((r) => r.asesor !== "Sin asignar"),
      sinAsignar: orden.find((r) => r.asesor === "Sin asignar") ?? null,
    };
  }, [cat, sub, data.asesorDetalle]);

  const max = Math.max(1, ...filas.oficiales.map((r) => r.volumen));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">
            Categoría
          </span>
          <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setSub("");
            }}
            className="min-w-[190px] rounded-lg border border-black-10 bg-white px-3 py-1.5 text-xs text-black-85"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">
            Subcategoría
          </span>
          <select
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            disabled={!cat}
            className="min-w-[190px] rounded-lg border border-black-10 bg-white px-3 py-1.5 text-xs text-black-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todas las subcategorías</option>
            {subcategorias.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto text-xs text-black-45">
          {fmtNum(filas.total)} atenciones · {filas.oficiales.length} asesores
        </span>
      </div>

      {filas.oficiales.length === 0 ? (
        <p className="py-8 text-center text-sm text-black-25">
          Sin información para el filtro seleccionado.
        </p>
      ) : (
        <ul className="space-y-3">
          {filas.oficiales.map((r) => (
            <li key={r.asesor}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-black-85">{r.asesor}</span>
                <span className="whitespace-nowrap text-right">
                  <span className="font-semibold text-black-85">{fmtNum(r.volumen)}</span>
                  <span className="ml-2 text-xs text-black-45">{fmtPct1(r.pct)}</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(r.volumen / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {filas.sinAsignar && filas.sinAsignar.volumen > 0 ? (
        <div className="mt-4 border-t border-dashed border-black-10 pt-3">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-black-45">
              <span className="inline-block h-2 w-2 rounded-full bg-[#94a3b8]" />
              Sin asignar <span className="text-[10px] uppercase">(calidad)</span>
            </span>
            <span className="whitespace-nowrap text-right">
              <span className="font-semibold text-black-45">
                {fmtNum(filas.sinAsignar.volumen)}
              </span>
              <span className="ml-2 text-xs text-black-45">{fmtPct1(filas.sinAsignar.pct)}</span>
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#94a3b8]"
              style={{ width: `${(filas.sinAsignar.volumen / max) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <details className="mt-4 rounded-lg border border-black-10 bg-[#F8F9FA] p-3">
        <summary className="cursor-pointer text-xs font-medium text-black-45">
          Ver equivalencias de nombres ({data.asesorTrazabilidad.length} originales →{" "}
          {new Set(data.asesorTrazabilidad.map((r) => r.consolidado)).size} asesores)
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-black-45">
              <th className="pb-1 pr-3">Nombre original</th>
              <th className="pb-1 pr-3">Asesor consolidado</th>
              <th className="pb-1 text-right">Atenciones</th>
            </tr>
          </thead>
          <tbody>
            {data.asesorTrazabilidad.map((r) => (
              <tr key={r.original} className="border-t border-black-5">
                <td className="py-1 pr-3 text-black-45">{r.original}</td>
                <td className="py-1 pr-3 text-black-85">{r.consolidado}</td>
                <td className="py-1 text-right text-black-85">{fmtNum(r.volumen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="mt-3 text-[11px] text-black-25">
        Volumen asignado en origen, no resuelto por el asesor. La consolidación usa una tabla
        explícita de equivalencias; la suma de asesores coincide con el total del reporte.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  TABLA JERÁRQUICA                                               */
/* ════════════════════════════════════════════════════════════════ */
function TablaJerarquica({
  items,
}: {
  items: CategoriasV2Response["jerarquia"];
}) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const catMap = new Map<
      string,
      { total: number; subs: Map<string, { total: number; dominios: Map<string, number> }> }
    >();
    for (const r of items) {
      if (!catMap.has(r.categoria)) catMap.set(r.categoria, { total: 0, subs: new Map() });
      const entry = catMap.get(r.categoria)!;
      entry.total += r.volumen;
      if (!entry.subs.has(r.subcategoria)) entry.subs.set(r.subcategoria, { total: 0, dominios: new Map() });
      const sub = entry.subs.get(r.subcategoria)!;
      sub.total += r.volumen;
      sub.dominios.set(r.dominio, (sub.dominios.get(r.dominio) ?? 0) + r.volumen);
    }
    const cats = [...catMap.entries()]
      .map(([categoria, v]) => ({
        categoria,
        total: v.total,
        subcategorias: [...v.subs.entries()]
          .map(([subcategoria, s]) => ({
            subcategoria,
            total: s.total,
            dominios: [...s.dominios.entries()]
              .map(([dominio, total]) => ({ dominio, total }))
              .sort((a, b) => b.total - a.total),
          }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);
    const grandTotal = cats.reduce((s, c) => s + c.total, 0);
    return { cats, grandTotal };
  }, [items]);

  const toggleCat = (cat: string) =>
    setExpandedCats((prev) => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat);
      else n.add(cat);
      return n;
    });

  const toggleSub = (key: string) =>
    setExpandedSubs((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  if (!tree.cats.length) {
    return <p className="py-8 text-center text-sm text-black-25">Sin información.</p>;
  }

  return (
    <div className="max-h-[480px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
            <th className="w-8 pb-3 pr-3" />
            <th className="pb-3 pr-3">Categoría</th>
            <th className="pb-3 pr-3">Subcategoría</th>
            <th className="pb-3 pr-3">Dominio</th>
            <th className="pb-3 pr-3 text-right">Cantidad</th>
            <th className="pb-3 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {tree.cats.map((cat) => {
            const catOpen = expandedCats.has(cat.categoria);
            return (
              <Fragment key={cat.categoria}>
                <tr
                  className="cursor-pointer border-t border-black-5 hover:bg-[#F8F9FA]"
                  onClick={() => toggleCat(cat.categoria)}
                >
                  <td className="py-2.5 pr-3">
                    {catOpen ? (
                      <ChevronDown size={14} className="text-black-45" />
                    ) : (
                      <ChevronRight size={14} className="text-black-45" />
                    )}
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-black-85">
                    <span className="flex flex-wrap items-center gap-2">
                      {cat.categoria}
                      {esTecnica(cat.categoria) ? (
                        <span className="rounded border border-black-10 bg-[#F8F9FA] px-1.5 py-0.5 text-[9px] font-medium uppercase text-black-45">
                          técnica
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-black-45">
                    {cat.subcategorias.length} subcategorías
                  </td>
                  <td className="py-2.5 pr-3" />
                  <td className="py-2.5 pr-3 text-right font-medium text-black-85">
                    {fmtNum(cat.total)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-black-85">
                    {fmtPct((cat.total / tree.grandTotal) * 100)}
                  </td>
                </tr>

                {catOpen &&
                  cat.subcategorias.map((sub) => {
                    const subKey = `${cat.categoria}|${sub.subcategoria}`;
                    const subOpen = expandedSubs.has(subKey);
                    return (
                      <Fragment key={subKey}>
                        <tr
                          className="cursor-pointer border-t border-[#F8F9FA] hover:bg-[#F8F9FA]"
                          onClick={() => toggleSub(subKey)}
                        >
                          <td className="py-2 pr-3" />
                          <td className="py-2 pr-3" />
                          <td className="py-2 pl-6 pr-3 text-xs text-[#475569]">
                            {sub.subcategoria}
                          </td>
                          <td className="py-2 pr-3 text-xs text-black-25">
                            {subOpen ? "" : `${sub.dominios.length} dominios`}
                          </td>
                          <td className="py-2 pr-3 text-right text-xs text-[#475569]">
                            {fmtNum(sub.total)}
                          </td>
                          <td className="py-2 text-right text-xs text-[#475569]">
                            {fmtPct((sub.total / tree.grandTotal) * 100)}
                          </td>
                        </tr>

                        {subOpen &&
                          sub.dominios.map((dom) => (
                            <tr key={`${subKey}|${dom.dominio}`} className="border-t border-[#F8F9FA]">
                              <td className="py-2 pr-3" />
                              <td className="py-2 pr-3" />
                              <td className="py-2 pr-3" />
                              <td className="py-2 pl-10 pr-3 font-mono text-xs text-[#475569]">
                                {dom.dominio}
                              </td>
                              <td className="py-2 pr-3 text-right text-xs text-[#475569]">
                                {fmtNum(dom.total)}
                              </td>
                              <td className="py-2 text-right text-xs text-[#475569]">
                                {fmtPct((dom.total / tree.grandTotal) * 100)}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ════════════════════════════════════════════════════════════════ */
export default function CategoriasV2() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categorias-v2", params],
    queryFn: () => fetchData(params),
    refetchOnWindowFocus: false,
  });

  const [catPareto, setCatPareto] = useState("");

  const categorias = data?.paretoCategorias.map((r) => r.categoria) ?? [];
  const catActual =
    catPareto && categorias.includes(catPareto) ? catPareto : categorias[0] ?? "";

  const subItems = useMemo<ParetoItem[]>(() => {
    if (!data) return [];
    const rows = data.paretoSubcategorias
      .filter((r) => r.categoria === catActual)
      .sort((a, b) => b.volumen - a.volumen);
    const total = rows.reduce((s, r) => s + r.volumen, 0);
    let acum = 0;
    return rows.map((r) => {
      acum += r.volumen;
      return {
        label: r.subcategoria,
        volumen: r.volumen,
        pct: total > 0 ? Math.round((r.volumen / total) * 1000) / 10 : 0,
        acumulado: total > 0 ? Math.round((acum / total) * 1000) / 10 : 0,
        tecnica: false,
      };
    });
  }, [data, catActual]);

  const paretoItems = useMemo<ParetoItem[]>(
    () =>
      (data?.paretoCategorias ?? []).map((r) => ({
        label: r.categoria,
        volumen: r.volumen,
        pct: r.pct,
        acumulado: r.acumulado,
        tecnica: r.tecnica,
      })),
    [data],
  );

  const kpiTiempo = useMemo(
    () =>
      [...(data?.categoriasTiempo ?? [])]
        .filter((r) => r.tiempo_atencion != null)
        .sort((a, b) => (b.tiempo_atencion ?? 0) - (a.tiempo_atencion ?? 0)),
    [data],
  );

  const kpiSLA = useMemo(
    () =>
      [...(data?.categoriasSLA ?? [])]
        .filter((r) => r.pctIncumple != null)
        .sort((a, b) => (b.pctIncumple ?? 0) - (a.pctIncumple ?? 0)),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center"
      >
        <p className="text-sm text-black-25">
          No se pudieron cargar los datos. Revisa que el backend esté encendido y conectado.
        </p>
      </motion.div>
    );
  }

  const lider = data.paretoCategorias[0] ?? null;
  const tiempoTop = kpiTiempo[0] ?? null;
  const tiempoSinTecnica = kpiTiempo.find((r) => !r.tecnica) ?? null;
  const slaTop = kpiSLA[0] ?? null;
  const slaSinTecnica = kpiSLA.find((r) => !r.tecnica) ?? null;
  const subtotalTecnicas = data.paretoCategorias
    .filter((r) => r.tecnica)
    .reduce((s, r) => s + r.volumen, 0);
  const pctTecnicas =
    data.universo.total > 0 ? (subtotalTecnicas / data.universo.total) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">Análisis de Categorías</h1>
          <p className="mt-1 text-sm text-muted">
            Atenciones finalizadas por categoría y subcategoría. Mismo universo en todos los
            componentes.
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            {fmtNum(data.universo.total)} atenciones finalizadas
          </span>
          <p className="mt-1">
            {fmtNum(data.totalCategorias)} categorías · {fmtNum(data.totalSubcategorias)}{" "}
            subcategorías
          </p>
          <p className="mt-0.5">
            {fmtNum(data.universo.excluidas)} excluidas: {fmtNum(data.universo.abiertas)} abiertas ·{" "}
            {fmtNum(data.universo.sinEstado)} sin estado homologado
          </p>
        </div>
      </div>

      {/* 4 KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Tags size={18} />}
          label="Atenciones analizadas"
          value={fmtNum(data.universo.total)}
          hint={`${fmtNum(data.totalCategorias)} categorías · ${fmtNum(
            data.totalSubcategorias,
          )} subcategorías`}
        />
        <KpiCard
          icon={<Medal size={18} />}
          label="Categoría líder"
          value={lider?.categoria ?? "—"}
          hint={
            lider
              ? `${fmtNum(lider.volumen)} atenciones · ${fmtPct1(lider.pct)} del total`
              : undefined
          }
        />
        <KpiCard
          icon={<Clock size={18} />}
          label="Mayor tiempo de resolución"
          value={fmtDur(tiempoTop?.tiempo_atencion)}
          hint={
            tiempoTop
              ? `${tiempoTop.categoria}${tiempoTop.tecnica ? " (técnica)" : ""}${
                  tiempoSinTecnica && tiempoSinTecnica !== tiempoTop
                    ? ` · sin técnicas: ${tiempoSinTecnica.categoria} ${fmtDur(
                        tiempoSinTecnica.tiempo_atencion,
                      )}`
                    : ""
                }`
              : undefined
          }
        />
        <KpiCard
          icon={<AlertTriangle size={18} />}
          label="Mayor incumplimiento SLA"
          value={fmtPct1(slaTop?.pctIncumple)}
          hint={
            slaTop
              ? `${slaTop.categoria}${slaTop.tecnica ? " (técnica)" : ""} · ${fmtNum(
                  slaTop.noCumple,
                )} de ${fmtNum(slaTop.conDato)} evaluables${
                  slaSinTecnica && slaSinTecnica !== slaTop
                    ? ` · sin técnicas: ${slaSinTecnica.categoria} ${fmtPct1(
                        slaSinTecnica.pctIncumple,
                      )}`
                    : ""
                }`
              : undefined
          }
        />
      </div>

      {/* Pareto de categorías */}
      <Section
        title="Pareto de categorías"
        subtitle="Barras = atenciones · Línea = % acumulado · Referencia 80%. Las categorías técnicas se muestran en gris."
      >
        <ParetoChart items={paretoItems} height={390} />
        <p className="mt-2 text-[11px] text-black-25">
          {(() => {
            const cruce = data.paretoCategorias.find((r) => r.acumulado >= 80);
            return cruce ? (
              <>
                El 80% se alcanza con <b>{cruce.categoria}</b> ({fmtPct1(cruce.acumulado)} del
                volumen acumulado).
              </>
            ) : null;
          })()}{" "}
          Categorías técnicas: {fmtNum(subtotalTecnicas)} atenciones ({fmtPct1(pctTecnicas)}). Se
          conservan en todos los cálculos y se identifican visualmente.
        </p>
      </Section>

      {/* Pareto contextual de subcategorías */}
      <Section
        title="Pareto contextual de subcategorías"
        subtitle="Selecciona una categoría. Los porcentajes y el acumulado se calculan dentro de esa categoría."
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">
              Categoría
            </span>
            <select
              value={catActual}
              onChange={(e) => setCatPareto(e.target.value)}
              className="min-w-[230px] rounded-lg border border-black-10 bg-white px-3 py-1.5 text-xs text-black-85"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-black-45">
            {fmtNum(subItems.reduce((s, r) => s + r.volumen, 0))} atenciones ·{" "}
            {fmtNum(subItems.length)} subcategorías
          </span>
        </div>

        {subItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-black-25">
            Sin subcategorías para la categoría seleccionada.
          </p>
        ) : (
          <>
            <ParetoChart items={subItems} height={330} maxItems={20} />
            <p className="mt-2 text-[11px] text-black-25">
              Se muestran las 20 subcategorías de mayor volumen de {catActual}. El detalle completo
              está en la tabla jerárquica.
            </p>
          </>
        )}
      </Section>

      {/* Rankings */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section
          title="Ranking de tiempo de resolución"
          subtitle="Promedio de resolución por categoría. Solo atenciones con tiempo registrado."
        >
          <RankingTiempo items={data.categoriasTiempo} />
          <p className="mt-2 text-[11px] text-black-25">
            Tiempo promedio = AVG(resolucion_min_norm). Los registros sin tiempo no se convierten en
            cero. Las categorías técnicas se muestran en gris.
          </p>
        </Section>

        <Section
          title="Ranking de incumplimiento SLA"
          subtitle="Porcentaje de atenciones que superan la meta de resolución de su canal."
        >
          <RankingSLA items={data.categoriasSLA} />
          <p className="mt-2 text-[11px] text-black-25">
            Metas: WhatsApp {fmtNum(data.slaMetas.whatsapp)} min · Correo/Zendesk{" "}
            {fmtNum(data.slaMetas.correo)} min · Otro {fmtNum(data.slaMetas.otro)} min. Denominador:
            atenciones con tiempo de resolución.
          </p>
        </Section>
      </div>

      {/* Asesor */}
      <Section
        title="Análisis comparativo por asesor"
        subtitle="Volumen asignado y participación sobre el total filtrado. Los registros sin asesor se muestran aparte cuando existen."
      >
        <AnalisisAsesor data={data} />
      </Section>

      {/* Tabla jerárquica */}
      <Section
        title="Tabla jerárquica"
        subtitle="Categoría → Subcategoría → Dominio. Colapsada por defecto; los porcentajes se calculan sobre el total del reporte."
      >
        <TablaJerarquica items={data.jerarquia} />
      </Section>

      <div className="rounded-xl border border-border bg-bg px-4 py-3 text-[11px] text-muted">
        Universo: atenciones con estado homologado <b>cerrado</b> o <b>resuelto</b>. Se excluyen{" "}
        {fmtNum(data.universo.abiertas)} abiertas y {fmtNum(data.universo.sinEstado)} sin estado
        homologado. Los registros sin categoría permanecen en los totales. No se deduplican los
        tickets presentes en más de un canal, para mantener la reconciliación con Resumen.
      </div>
    </motion.div>
  );
}
