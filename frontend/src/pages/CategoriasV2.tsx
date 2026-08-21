import { useState, useMemo, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tags, List, Medal, Award, ChevronRight, ChevronDown } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, fmtPct, fmtDur, KpiCard, Section } from "@/components/dashboard/shared";

/* ─── Tipos ─── */
interface CategoriasV2Response {
  totalCategorias: number;
  totalSubcategorias: number;
  categoriaLider: { nombre: string; volumen: number } | null;
  subcategoriaLider: { nombre: string; volumen: number } | null;
  paretoCategorias: { categoria: string; volumen: number; pct: number; acumulado: number }[];
  paretoSubcategorias: { subcategoria: string; volumen: number; pct: number; acumulado: number }[];
  jerarquia: { categoria: string; subcategoria: string; dominio: string; volumen: number }[];
  categoriasTiempo: { categoria: string; volumen: number; tiempo_resolucion: number | null; tiempo_espera: number | null; tiempo_atencion: number | null; sla: number | null }[];
  subcategoriasTiempo: { subcategoria: string; categoria: string; volumen: number; tiempo_resolucion: number | null; sla: number | null }[];
  categoriasSLA: { categoria: string; volumen: number; sla: number | null }[];
  subcategoriasSLA: { subcategoria: string; categoria: string; volumen: number; sla: number | null }[];
  matrizAsesor: { asesor: string; categoria: string; volumen: number }[];
  matrizSubAsesor: { asesor: string; subcategoria: string; volumen: number }[];
  impacto: { categoria: string; volumen: number; tiempo: number | null; sla: number | null }[];
}

async function fetchData(params: Record<string, string>): Promise<CategoriasV2Response> {
  const { data } = await api.get("/dashboard/categorias-v2", { params });
  return data.data as CategoriasV2Response;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ─── ValidatedChart wrapper ─── */
function ValidatedChart({ data, required, title, subtitle, children }: {
  data: unknown;
  required: string[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(data) ? data : null;

  useEffect(() => {
    if (!arr) {
      console.warn(`⚠️ [${title}] dataset es null/undefined`);
      return;
    }
    if (arr.length === 0) {
      console.warn(`⚠️ [${title}] dataset vacío (0 registros)`);
      return;
    }
    const row = arr[0] as Record<string, unknown>;
    const missing = required.filter((f) => !(f in row));
    if (missing.length) {
      console.error(`❌ [${title}] faltan campos: ${missing.join(", ")}`);
    } else {
      console.log(`✅ [${title}] ${arr.length} registros, campos OK`);
    }
  }, [arr, required, title]);

  if (!arr) {
    return (
      <Section title={title} subtitle={subtitle}>
        <p className="text-sm text-black-25 py-8 text-center">Sin información para el rango seleccionado.</p>
      </Section>
    );
  }
  if (arr.length === 0) {
    return (
      <Section title={title} subtitle={subtitle}>
        <p className="text-sm text-black-25 py-8 text-center">Sin información para el rango seleccionado.</p>
      </Section>
    );
  }
  const row = arr[0] as Record<string, unknown>;
  const missing = required.filter((f) => !(f in row));
  if (missing.length) {
    return (
      <Section title={title} subtitle={subtitle}>
        <p className="text-sm text-danger py-4">Error: propiedad(es) faltante(s): {missing.join(", ")}</p>
      </Section>
    );
  }

  return <Section title={title} subtitle={subtitle}>{children}</Section>;
}

const ASESORES_OFICIALES = ["Andres", "Danilo", "Eveling", "Lidia", "Lisbeth", "Sheyla", "Victor"];

/* ════════════════════════════════════════════════════════════════ */
/*  PARETO CATEGORÍAS                                              */
/* ════════════════════════════════════════════════════════════════ */
function ParetoCategoriasChart({ items }: { items: { categoria: string; volumen: number; pct: number; acumulado: number }[] }) {
  const muted = cssVar("--muted");
  const primary = cssVar("--primary");
  const names = items.map(i => i.categoria);
  const volumes = items.map(i => i.volumen);
  const acums = items.map(i => i.acumulado);

  const opt = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "cross" as const },
      formatter: (ps: { dataIndex: number }[]) => {
        const i = items[ps[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.categoria}</b>`,
          `Volumen: <b>${fmtNum(i.volumen)}</b>`,
          `%: ${i.pct}%`,
          `% Acumulado: ${i.acumulado}%`,
        ].join("<br/>");
      },
    },
    grid: { left: 60, right: 60, top: 30, bottom: 70 },
    xAxis: { type: "category" as const, data: names, axisLabel: { color: muted, fontSize: 10, rotate: 30, interval: 0 } },
    yAxis: [
      { type: "value" as const, name: "Volumen", axisLabel: { color: muted }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
      { type: "value" as const, name: "% Acumulado", max: 100, axisLabel: { color: muted, formatter: "{value}%" }, splitLine: { show: false } },
    ],
    series: [
      {
        type: "bar" as const, data: volumes,
        itemStyle: { color: primary }, barMaxWidth: 28,
        label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? fmtNum(p.value) : "", color: muted, fontSize: 9 },
      },
      {
        type: "line" as const, yAxisIndex: 1, data: acums,
        smooth: true, lineStyle: { color: "#ef4444", width: 2 }, itemStyle: { color: "#ef4444" },
        areaStyle: { color: "rgba(239,68,68,0.1)" },
        label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? `${p.value}%` : "", color: "#ef4444", fontSize: 9 },
      },
    ],
  };

  return <ReactECharts option={opt} style={{ height: 360 }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  PARETO SUBCATEGORÍAS                                           */
/* ════════════════════════════════════════════════════════════════ */
function ParetoSubcategoriasChart({ items }: { items: { subcategoria: string; volumen: number; pct: number; acumulado: number }[] }) {
  const muted = cssVar("--muted");
  const primary = cssVar("--primary");
  const top = items.slice(0, 20);
  const names = top.map(i => i.subcategoria);
  const volumes = top.map(i => i.volumen);
  const acums = top.map(i => i.acumulado);

  const opt = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "cross" as const },
      formatter: (ps: { dataIndex: number }[]) => {
        const i = top[ps[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.subcategoria}</b>`,
          `Volumen: <b>${fmtNum(i.volumen)}</b>`,
          `%: ${i.pct}%`,
          `% Acumulado: ${i.acumulado}%`,
        ].join("<br/>");
      },
    },
    grid: { left: 60, right: 60, top: 30, bottom: 70 },
    xAxis: { type: "category" as const, data: names, axisLabel: { color: muted, fontSize: 10, rotate: 30, interval: 0 } },
    yAxis: [
      { type: "value" as const, name: "Volumen", axisLabel: { color: muted }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
      { type: "value" as const, name: "% Acumulado", max: 100, axisLabel: { color: muted, formatter: "{value}%" }, splitLine: { show: false } },
    ],
    series: [
      {
        type: "bar" as const, data: volumes,
        itemStyle: { color: primary }, barMaxWidth: 28,
        label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? fmtNum(p.value) : "", color: muted, fontSize: 9 },
      },
      {
        type: "line" as const, yAxisIndex: 1, data: acums,
        smooth: true, lineStyle: { color: "#ef4444", width: 2 }, itemStyle: { color: "#ef4444" },
        areaStyle: { color: "rgba(239,68,68,0.1)" },
        label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? `${p.value}%` : "", color: "#ef4444", fontSize: 9 },
      },
    ],
  };

  return <ReactECharts option={opt} style={{ height: 360 }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  MATRIZ JERÁRQUICA                                              */
/* ════════════════════════════════════════════════════════════════ */
function MatrizJerarquicaChart({ items }: { items: { categoria: string; subcategoria: string; dominio: string; volumen: number }[] }) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  // Construir árbol Categoría → Subcategoría → Dominio, ordenado por volumen desc en cada nivel.
  const tree = useMemo(() => {
    const catMap = new Map<string, { total: number; subs: Map<string, { total: number; dominios: Map<string, number> }> }>();
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
            dominios: [...s.dominios.entries()].map(([dominio, total]) => ({ dominio, total })).sort((a, b) => b.total - a.total),
          }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);
    const grandTotal = cats.reduce((s, c) => s + c.total, 0);
    return { cats, grandTotal };
  }, [items]);

  const toggleCat = (cat: string) => setExpandedCats((prev) => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; });
  const toggleSub = (key: string) => setExpandedSubs((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  if (!tree.cats.length) return null;

  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
            <th className="pb-3 pr-4 w-8" />
            <th className="pb-3 pr-4">Categoría</th>
            <th className="pb-3 pr-4">Subcategoría</th>
            <th className="pb-3 pr-4">Dominio</th>
            <th className="pb-3 pr-4 text-right">Cantidad</th>
            <th className="pb-3 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {tree.cats.map((cat) => {
            const catOpen = expandedCats.has(cat.categoria);
            return (
              <Fragment key={cat.categoria}>
                {/* Nivel 1: Categoría */}
                <tr className="border-t border-black-5 cursor-pointer hover:bg-light" onClick={() => toggleCat(cat.categoria)}>
                  <td className="py-2.5 pr-4">{catOpen ? <ChevronDown size={14} className="text-black-45" /> : <ChevronRight size={14} className="text-black-45" />}</td>
                  <td className="py-2.5 pr-4 font-semibold text-black-85">{cat.categoria}</td>
                  <td className="py-2.5 pr-4 text-black-25 text-xs">{cat.subcategorias.length} subcategorías</td>
                  <td className="py-2.5 pr-4 text-black-25 text-xs" />
                  <td className="py-2.5 pr-4 text-right font-medium text-black-85">{fmtNum(cat.total)}</td>
                  <td className="py-2.5 text-right font-medium text-black-85">{fmtPct((cat.total / tree.grandTotal) * 100)}</td>
                </tr>
                {catOpen && cat.subcategorias.map((sub) => {
                  const subKey = `${cat.categoria}|${sub.subcategoria}`;
                  const subOpen = expandedSubs.has(subKey);
                  return (
                    <Fragment key={subKey}>
                      {/* Nivel 2: Subcategoría */}
                      <tr className="border-t border-[#F8F9FA] cursor-pointer hover:bg-light" onClick={() => toggleSub(subKey)}>
                        <td className="py-2 pr-4" />
                        <td className="py-2 pr-4" />
                        <td className="py-2 pr-4 pl-6 text-[#475569] text-xs">{sub.subcategoria}</td>
                        <td className="py-2 pr-4 text-black-25 text-xs">{subOpen ? "" : `${sub.dominios.length} dominios`}</td>
                        <td className="py-2 pr-4 text-right text-[#475569] text-xs">{fmtNum(sub.total)}</td>
                        <td className="py-2 text-right text-[#475569] text-xs">{fmtPct((sub.total / tree.grandTotal) * 100)}</td>
                      </tr>
                      {subOpen && sub.dominios.map((dom) => (
                        <tr key={`${subKey}|${dom.dominio}`} className="border-t border-[#F8F9FA]">
                          <td className="py-2 pr-4" />
                          <td className="py-2 pr-4" />
                          <td className="py-2 pr-4" />
                          <td className="py-2 pr-4 pl-10 font-mono text-[#475569] text-xs">{dom.dominio}</td>
                          <td className="py-2 pr-4 text-right text-[#475569] text-xs">{fmtNum(dom.total)}</td>
                          <td className="py-2 text-right text-[#475569] text-xs">{fmtPct((dom.total / tree.grandTotal) * 100)}</td>
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
/*  CATEGORÍAS VS TIEMPO DE RESOLUCIÓN                              */
/* ════════════════════════════════════════════════════════════════ */
function CategoriasTiempoChart({ items }: { items: { categoria: string; volumen: number; tiempo_resolucion: number | null; tiempo_espera: number | null; tiempo_atencion: number | null; sla: number | null }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const sorted = useMemo(() => [...items].sort((a, b) => (b.tiempo_resolucion ?? 0) - (a.tiempo_resolucion ?? 0)), [items]);
  const maxVal = Math.max(...sorted.map(i => i.tiempo_resolucion ?? 0), 1);

  const opt = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (ps: { dataIndex: number }[]) => {
        const i = sorted[ps[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.categoria}</b>`,
          `Volumen: ${fmtNum(i.volumen)}`,
          `Tiempo resolución: ${fmtDur(i.tiempo_resolucion)}`,
          `Tiempo espera: ${fmtDur(i.tiempo_espera)}`,
          `Tiempo atención: ${fmtDur(i.tiempo_atencion)}`,
          `SLA: ${fmtPct(i.sla)}`,
        ].join("<br/>");
      },
    },
    grid: { left: 180, right: 60, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, axisLabel: { color: muted, formatter: (v: number) => fmtDur(v) }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted.map(i => i.categoria), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{
      type: "bar" as const, data: sorted.map(i => i.tiempo_resolucion),
      barMaxWidth: 18,
      itemStyle: {
        color: (p: { value: number }) => {
          const r = (p.value ?? 0) / maxVal;
          return r > 0.7 ? "#ef4444" : r > 0.4 ? "#f59e0b" : "#22c55e";
        },
        borderRadius: [0, 4, 4, 0],
      },
      label: { show: true, position: "right" as const, formatter: (p: { value: number }) => fmtDur(p.value), color: textColor, fontSize: 10 },
    }],
  };

  return <ReactECharts option={opt} style={{ height: Math.max(160, sorted.length * 22 + 40) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  SUBCATEGORÍAS VS TIEMPO DE RESOLUCIÓN (Top 15)                  */
/* ════════════════════════════════════════════════════════════════ */
function SubcategoriasTiempoChart({ items }: { items: { subcategoria: string; categoria: string; volumen: number; tiempo_resolucion: number | null; sla: number | null }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const sorted = useMemo(() => {
    const top = [...items].sort((a, b) => b.volumen - a.volumen).slice(0, 15);
    return top.sort((a, b) => (b.tiempo_resolucion ?? 0) - (a.tiempo_resolucion ?? 0));
  }, [items]);
  const maxVal = Math.max(...sorted.map(i => i.tiempo_resolucion ?? 0), 1);

  const opt = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (ps: { dataIndex: number }[]) => {
        const i = sorted[ps[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.subcategoria}</b>`,
          `Categoría: ${i.categoria}`,
          `Volumen: ${fmtNum(i.volumen)}`,
          `Tiempo resolución: ${fmtDur(i.tiempo_resolucion)}`,
          `SLA: ${fmtPct(i.sla)}`,
        ].join("<br/>");
      },
    },
    grid: { left: 200, right: 60, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, axisLabel: { color: muted, formatter: (v: number) => fmtDur(v) }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted.map(i => i.subcategoria), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{
      type: "bar" as const, data: sorted.map(i => i.tiempo_resolucion),
      barMaxWidth: 18,
      itemStyle: {
        color: (p: { value: number }) => {
          const r = (p.value ?? 0) / maxVal;
          return r > 0.7 ? "#ef4444" : r > 0.4 ? "#f59e0b" : "#22c55e";
        },
        borderRadius: [0, 4, 4, 0],
      },
      label: { show: true, position: "right" as const, formatter: (p: { value: number }) => fmtDur(p.value), color: textColor, fontSize: 10 },
    }],
  };

  return <ReactECharts option={opt} style={{ height: Math.max(160, sorted.length * 22 + 40) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  CATEGORÍAS VS SLA                                               */
/* ════════════════════════════════════════════════════════════════ */
function CategoriasSLAChart({ items }: { items: { categoria: string; volumen: number; sla: number | null }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const sorted = useMemo(() => [...items].sort((a, b) => (a.sla ?? 0) - (b.sla ?? 0)), [items]);

  const opt = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (ps: { dataIndex: number }[]) => {
        const i = sorted[ps[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.categoria}</b>`,
          `Volumen: ${fmtNum(i.volumen)}`,
          `SLA: ${fmtPct(i.sla)}`,
        ].join("<br/>");
      },
    },
    grid: { left: 180, right: 60, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, max: 100, axisLabel: { color: muted, formatter: "{value}%" }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted.map(i => i.categoria), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{
      type: "bar" as const, data: sorted.map(i => i.sla),
      barMaxWidth: 18,
      itemStyle: {
        color: (p: { value: number }) => p.value >= 95 ? "#22c55e" : p.value >= 80 ? "#f59e0b" : "#ef4444",
        borderRadius: [0, 4, 4, 0],
      },
      label: { show: true, position: "right" as const, formatter: (p: { value: number }) => `${p.value}%`, color: textColor, fontSize: 10 },
    }],
  };

  return <ReactECharts option={opt} style={{ height: Math.max(160, sorted.length * 22 + 40) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  SUBCATEGORÍAS VS SLA                                            */
/* ════════════════════════════════════════════════════════════════ */
function SubcategoriasSLAChart({ items }: { items: { subcategoria: string; categoria: string; volumen: number; sla: number | null }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const sorted = useMemo(() => {
    const top = [...items].sort((a, b) => b.volumen - a.volumen).slice(0, 15);
    return top.sort((a, b) => (a.sla ?? 0) - (b.sla ?? 0));
  }, [items]);

  const opt = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (ps: { dataIndex: number }[]) => {
        const i = sorted[ps[0]?.dataIndex];
        if (!i) return "";
        return [
          `<b>${i.subcategoria}</b>`,
          `Categoría: ${i.categoria}`,
          `Volumen: ${fmtNum(i.volumen)}`,
          `SLA: ${fmtPct(i.sla)}`,
        ].join("<br/>");
      },
    },
    grid: { left: 200, right: 60, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, max: 100, axisLabel: { color: muted, formatter: "{value}%" }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted.map(i => i.subcategoria), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{
      type: "bar" as const, data: sorted.map(i => i.sla),
      barMaxWidth: 18,
      itemStyle: {
        color: (p: { value: number }) => p.value >= 95 ? "#22c55e" : p.value >= 80 ? "#f59e0b" : "#ef4444",
        borderRadius: [0, 4, 4, 0],
      },
      label: { show: true, position: "right" as const, formatter: (p: { value: number }) => `${p.value}%`, color: textColor, fontSize: 10 },
    }],
  };

  return <ReactECharts option={opt} style={{ height: Math.max(160, sorted.length * 22 + 40) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  HEATMAP CATEGORÍA × ASESOR                                     */
/* ════════════════════════════════════════════════════════════════ */
function HeatmapCatAsesorChart({ items }: { items: { asesor: string; categoria: string; volumen: number }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const { cats, ases, maxV } = useMemo(() => {
    const filtered = items.filter(i => ASESORES_OFICIALES.includes(i.asesor));
    const catSet = [...new Set(filtered.map(i => i.categoria))];
    const aseSet = [...new Set(filtered.map(i => i.asesor))].sort((a, b) => ASESORES_OFICIALES.indexOf(a) - ASESORES_OFICIALES.indexOf(b));
    return { cats: catSet, ases: aseSet, maxV: Math.max(...filtered.map(i => i.volumen), 1) };
  }, [items]);

  const data = cats.flatMap((cat, ci) => ases.map((asesor, ai) => {
    const f = items.find(i => i.categoria === cat && i.asesor === asesor);
    return [ai, ci, f?.volumen ?? 0] as number[];
  }));

  const opt = {
    tooltip: {
      formatter: (p: { value: number[] }) => {
        const cat = cats[p.value[1]];
        const ase = ases[p.value[0]];
        const v = p.value[2];
        return [`<b>${cat}</b>`, `Asesor: ${ase}`, `Cantidad: ${fmtNum(v)}`].join("<br/>");
      },
    },
    grid: { left: 140, right: 60, top: 10, bottom: 70 },
    xAxis: { type: "category" as const, data: ases, axisLabel: { color: muted, fontSize: 10, rotate: 30 } },
    yAxis: { type: "category" as const, data: cats, axisLabel: { color: textColor, fontSize: 10 } },
    visualMap: { min: 0, max: maxV, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["#f0f9ff", "#3b82f6", "#1d4ed8"] } },
    series: [{
      type: "heatmap" as const, data,
      label: { show: true, color: "#fff", fontSize: 10, formatter: (p: { value: number[] }) => p.value[2] ? fmtNum(p.value[2]) : "" },
    }],
  };

  return <ReactECharts option={opt} style={{ height: Math.max(200, cats.length * 24 + 80) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  HEATMAP SUBCATEGORÍA × ASESOR (Top 20)                         */
/* ════════════════════════════════════════════════════════════════ */
function HeatmapSubAsesorChart({ items }: { items: { asesor: string; subcategoria: string; volumen: number }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const { subs, ases, maxV } = useMemo(() => {
    const topSubs = [...new Set(items.map(i => i.subcategoria))].slice(0, 20);
    const filtered = items.filter(i => topSubs.includes(i.subcategoria) && ASESORES_OFICIALES.includes(i.asesor));
    const aseSet = [...new Set(filtered.map(i => i.asesor))].sort((a, b) => ASESORES_OFICIALES.indexOf(a) - ASESORES_OFICIALES.indexOf(b));
    return { subs: topSubs, ases: aseSet, maxV: Math.max(...filtered.map(i => i.volumen), 1) };
  }, [items]);

  const data = subs.flatMap((sub, si) => ases.map((asesor, ai) => {
    const f = items.find(i => i.subcategoria === sub && i.asesor === asesor);
    return [ai, si, f?.volumen ?? 0] as number[];
  }));

  const opt = {
    tooltip: {
      formatter: (p: { value: number[] }) => {
        const sub = subs[p.value[1]];
        const ase = ases[p.value[0]];
        const v = p.value[2];
        return [`<b>${sub}</b>`, `Asesor: ${ase}`, `Cantidad: ${fmtNum(v)}`].join("<br/>");
      },
    },
    grid: { left: 200, right: 60, top: 10, bottom: 70 },
    xAxis: { type: "category" as const, data: ases, axisLabel: { color: muted, fontSize: 10, rotate: 30 } },
    yAxis: { type: "category" as const, data: subs, axisLabel: { color: textColor, fontSize: 10 } },
    visualMap: { min: 0, max: maxV, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["#f0f9ff", "#3b82f6", "#1d4ed8"] } },
    series: [{
      type: "heatmap" as const, data,
      label: { show: true, color: "#fff", fontSize: 10, formatter: (p: { value: number[] }) => p.value[2] ? fmtNum(p.value[2]) : "" },
    }],
  };

  return <ReactECharts option={opt} style={{ height: Math.max(200, subs.length * 24 + 80) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  BURBUJA — IMPACTO OPERATIVO                                    */
/* ════════════════════════════════════════════════════════════════ */
function ImpactoBubbleChart({ items }: { items: { categoria: string; volumen: number; tiempo: number | null; sla: number | null }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");

  const { data, avgX, avgY } = useMemo(() => {
    const vals = items.filter(i => i.tiempo != null && i.volumen > 0).map(i => ({
      value: [i.tiempo! * 60, i.volumen, i.volumen],
      name: i.categoria,
      tiempo: i.tiempo! * 60,
      volumen: i.volumen,
      sla: i.sla,
    }));
    const sx = vals.reduce((s, d) => s + d.tiempo, 0);
    const sy = vals.reduce((s, d) => s + d.volumen, 0);
    return { data: vals, avgX: vals.length ? sx / vals.length : 0, avgY: vals.length ? sy / vals.length : 0 };
  }, [items]);

  const opt = {
    tooltip: {
      formatter: (p: { data: { name: string; volumen: number; tiempo: number; sla: number | null } }) => {
        const d = p.data;
        return [
          `<b>${d.name}</b>`,
          `Volumen: ${fmtNum(d.volumen)}`,
          `Tiempo: ${fmtDur(d.tiempo)}`,
          `SLA: ${fmtPct(d.sla)}`,
        ].join("<br/>");
      },
    },
    grid: { left: 70, right: 30, top: 60, bottom: 50 },
    xAxis: { type: "value" as const, name: "Tiempo resolución (min)", nameTextStyle: { color: muted, fontSize: 11 }, axisLabel: { color: muted, formatter: (v: number) => `${Math.round(v)} min` }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "value" as const, name: "Volumen", nameTextStyle: { color: muted, fontSize: 11 }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    series: [{
      type: "scatter" as const,
      data: data.map(d => ({ value: d.value, name: d.name, tiempo: d.tiempo, volumen: d.volumen, sla: d.sla })),
      symbolSize: (val: number[]) => Math.max(14, Math.min(60, (val[2] / 500) * 40 + 14)),
      itemStyle: {
        color: (p: { data: { sla: number | null } }) => {
          const s = p.data?.sla ?? 0;
          return s >= 95 ? "#22c55e" : s >= 80 ? "#f59e0b" : "#ef4444";
        },
        shadowBlur: 6, shadowColor: "rgba(0,0,0,0.15)", opacity: 0.85,
      },
      label: { show: true, position: "right" as const, formatter: (p: { name: string }) => p.name, color: textColor, fontSize: 10 },
      markLine: {
        silent: true, lineStyle: { type: "dashed" as const, color: "#64748B", width: 1.5 }, label: { show: false },
        data: [{ xAxis: avgX }, { yAxis: avgY }],
      },
    }],
    graphic: [
      { type: "text" as const, left: "12%", top: 8, style: { text: "MUCHO VOLUMEN", fill: "#64748B", fontSize: 10, fontWeight: "bold" as const } },
      { type: "text" as const, right: "12%", top: 8, style: { text: "ALTA PRIORIDAD", fill: "#ef4444", fontSize: 10, fontWeight: "bold" as const } },
      { type: "text" as const, left: "12%", bottom: 8, style: { text: "BAJO IMPACTO", fill: "#22c55e", fontSize: 10, fontWeight: "bold" as const } },
      { type: "text" as const, right: "12%", bottom: 8, style: { text: "CASOS COMPLEJOS", fill: "#f59e0b", fontSize: 10, fontWeight: "bold" as const } },
    ],
  };

  return <ReactECharts option={opt} style={{ height: 460 }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                            */
/* ════════════════════════════════════════════════════════════════ */
export default function CategoriasV2() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["categorias-v2", params],
    queryFn: () => fetchData(params),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      console.log("📊 Dataset categorias-v2:", JSON.parse(JSON.stringify(data)));
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center">
        <p className="text-sm text-black-25">Sin información para el rango seleccionado.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-lg font-semibold text-text">Análisis de Categorías</h1>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Tags size={18} />} label="Total categorías" value={fmtNum(data.totalCategorias)} />
        <KpiCard icon={<List size={18} />} label="Total subcategorías" value={fmtNum(data.totalSubcategorias)} />
        <KpiCard
          icon={<Medal size={18} />}
          label="Categoría líder"
          value={data.categoriaLider ? data.categoriaLider.nombre : "—"}
          hint={data.categoriaLider ? `${fmtNum(data.categoriaLider.volumen)} atenciones` : undefined}
        />
        <KpiCard
          icon={<Award size={18} />}
          label="Subcategoría líder"
          value={data.subcategoriaLider ? data.subcategoriaLider.nombre : "—"}
          hint={data.subcategoriaLider ? `${fmtNum(data.subcategoriaLider.volumen)} atenciones` : undefined}
        />
      </div>

      {/* Pareto Categorías | Pareto Subcategorías */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ValidatedChart data={data.paretoCategorias} required={["categoria", "volumen", "pct", "acumulado"]} title="Pareto de categorías" subtitle="Barras = volumen · Línea = % acumulado">
          <ParetoCategoriasChart items={data.paretoCategorias} />
        </ValidatedChart>
        <ValidatedChart data={data.paretoSubcategorias} required={["subcategoria", "volumen", "pct", "acumulado"]} title="Pareto de subcategorías" subtitle="Barras = volumen · Línea = % acumulado (Top 20)">
          <ParetoSubcategoriasChart items={data.paretoSubcategorias} />
        </ValidatedChart>
      </div>

      {/* Matriz Jerárquica */}
      <ValidatedChart data={data.jerarquia} required={["categoria", "subcategoria", "dominio", "volumen"]} title="Matriz jerárquica" subtitle="Categoría → Subcategoría → Dominio · Ordenado por volumen descendente">
        <MatrizJerarquicaChart items={data.jerarquia} />
      </ValidatedChart>

      {/* Categorías vs Tiempo | Categorías vs SLA */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ValidatedChart data={data.categoriasTiempo} required={["categoria", "volumen", "tiempo_resolucion", "tiempo_espera", "tiempo_atencion", "sla"]} title="Categorías vs Tiempo de Resolución" subtitle="Ordenado de mayor a menor tiempo promedio">
          <CategoriasTiempoChart items={data.categoriasTiempo} />
        </ValidatedChart>
        <ValidatedChart data={data.categoriasSLA} required={["categoria", "volumen", "sla"]} title="Categorías vs SLA" subtitle="Ordenado de menor a mayor cumplimiento">
          <CategoriasSLAChart items={data.categoriasSLA} />
        </ValidatedChart>
      </div>

      {/* Subcategorías vs Tiempo | Subcategorías vs SLA */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ValidatedChart data={data.subcategoriasTiempo} required={["subcategoria", "volumen", "tiempo_resolucion", "sla"]} title="Subcategorías vs Tiempo de Resolución" subtitle="Top 15 por volumen">
          <SubcategoriasTiempoChart items={data.subcategoriasTiempo} />
        </ValidatedChart>
        <ValidatedChart data={data.subcategoriasSLA} required={["subcategoria", "volumen", "sla"]} title="Subcategorías vs SLA" subtitle="Top 15 por volumen">
          <SubcategoriasSLAChart items={data.subcategoriasSLA} />
        </ValidatedChart>
      </div>

      {/* Heatmap Categoría × Asesor */}
      <ValidatedChart data={data.matrizAsesor} required={["asesor", "categoria", "volumen"]} title="Categorías × Asesores" subtitle="Solo asesores de Soporte Especializado">
        <HeatmapCatAsesorChart items={data.matrizAsesor} />
      </ValidatedChart>

      {/* Heatmap Subcategoría × Asesor */}
      <ValidatedChart data={data.matrizSubAsesor} required={["asesor", "subcategoria", "volumen"]} title="Subcategorías × Asesores" subtitle="Top 20 subcategorías">
        <HeatmapSubAsesorChart items={data.matrizSubAsesor} />
      </ValidatedChart>

      {/* Bubble Impacto Operativo */}
      <ValidatedChart data={data.impacto} required={["categoria", "volumen", "tiempo", "sla"]} title="Impacto Operativo" subtitle="Tamaño = volumen · Color = SLA · Líneas = promedios">
        <ImpactoBubbleChart items={data.impacto} />
      </ValidatedChart>
    </motion.div>
  );
}
