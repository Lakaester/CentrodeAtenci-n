import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageCircle, Smartphone, Monitor, Clock, CheckCircle2, Target, BarChart3, AlertTriangle } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, fmtPct, fmtDur, KpiCard, Section, DataTable, Badge } from "@/components/dashboard/shared";

/* ─── Tipos ─── */
interface ResWhatsApp {
  kpis: {
    totalConversaciones: number; totalWhaticket: number; totalWhatmeta: number;
    pctWhaticket: number; pctWhatmeta: number;
    tiempoPrimeraRespuesta: number | null; tiempoResolucion: number | null; tiempoEspera: number | null;
    conversacionesAbiertas: number; conversacionesCerradas: number;
    cumplimientoSla: number | null; fcr: number | null;
  };
  distSubcanal: { subcanal: string; total: number; porcentaje: number; primeraRespuesta: number | null; resolucion: number | null; espera: number | null; sla: number | null; fcr: number | null }[];
  evolucion: { periodo: string; subcanal: string; total: number }[];
  heatmapHora: { hora: number; dia: number; total: number; subcanal: string }[];
  paises: { pais: string; total: number }[];
  treemap: { categoria: string; total: number; tiempoResolucion: number | null }[];
  topSubcategorias: { subcategoria: string; total: number; porcentaje: number }[];
  tiempos: { subcanal: string; primeraRespuesta: number | null; resolucion: number | null; espera: number | null }[];
  asesores: { asesor: string; subcanal: string; total: number; tiempoPromedio: number | null; sla: number | null; fcr: number | null; abiertos: number; pendientes: number }[];
  topClientes: { cliente: string; total: number }[];
  dominios: { dominio: string; total: number }[];
  conversacionesLargas: { cliente: string; asesor: string; subcanal: string; tiempoResolucion: number | null; fecha: string }[];
  paisCat: { pais: string; categoria: string; total: number }[];
  catAsesor: { categoria: string; asesor: string; total: number; tiempo: number | null; sla: number | null }[];
  insights: string[];
}

async function fetchData(params: Record<string, string>): Promise<ResWhatsApp> {
  const { data } = await api.get("/dashboard/whatsapp", { params });
  return data.data as ResWhatsApp;
}

function cn(...classes: (string | boolean | undefined | null)[]) { return classes.filter(Boolean).join(" "); }

const ASESORES_OFICIALES = ["Andres", "Danilo", "Eveling", "Lidia", "Lisbeth", "Sheyla", "Victor"];

/* ════════════════════════════════════════════════════════════════ */
/*  COMPARATIVA SUBCANAL                                           */
/* ════════════════════════════════════════════════════════════════ */
function ComparativaSubcanal({ items }: { items: ResWhatsApp["distSubcanal"] }) {
  const whaticket = items.find(i => i.subcanal.toLowerCase().includes("ticket"));
  const whatmeta = items.find(i => i.subcanal.toLowerCase().includes("meta"));

  if (!whaticket && !whatmeta) return <p className="text-sm text-black-25 py-8 text-center">Sin información para el rango seleccionado.</p>;

  const rows = [
    { label: "Volumen", whaticket: whaticket?.total ?? 0, whatmeta: whatmeta?.total ?? 0, fmt: (v: number) => fmtNum(v) },
    { label: "1ª respuesta", whaticket: whaticket?.primeraRespuesta ?? null, whatmeta: whatmeta?.primeraRespuesta ?? null, fmt: (v: number | null) => fmtDur(v) },
    { label: "Resolución", whaticket: whaticket?.resolucion ?? null, whatmeta: whatmeta?.resolucion ?? null, fmt: (v: number | null) => fmtDur(v) },
    { label: "Espera", whaticket: whaticket?.espera ?? null, whatmeta: whatmeta?.espera ?? null, fmt: (v: number | null) => fmtDur(v) },
    { label: "SLA", whaticket: whaticket?.sla ?? null, whatmeta: whatmeta?.sla ?? null, fmt: (v: number | null) => fmtPct(v) },
    { label: "FCR", whaticket: whaticket?.fcr ?? null, whatmeta: whatmeta?.fcr ?? null, fmt: (v: number | null) => fmtPct(v) },
  ];

  const total = (whaticket?.total ?? 0) + (whatmeta?.total ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Distribución operacional" subtitle="Volumen por subcanal">
        <div className="space-y-3">
          {[{ name: "Whaticket", v: whaticket?.total ?? 0, color: "#3b82f6" }, { name: "Whatmeta", v: whatmeta?.total ?? 0, color: "#22c55e" }].map(i => (
            <div key={i.name}>
              <div className="flex justify-between text-sm mb-1"><span className="font-medium text-black-85">{i.name}</span><span className="text-black-45">{fmtNum(i.v)} ({total > 0 ? Math.round(i.v / total * 100) : 0}%)</span></div>
              <div className="h-3 w-full rounded-full bg-black-5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? i.v / total * 100 : 0}%`, backgroundColor: i.color }} />
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Métricas comparativas" subtitle="Whaticket vs Whatmeta">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs font-semibold uppercase tracking-wider text-black-45"><th className="pb-2 text-left">Métrica</th><th className="pb-2 text-right px-2">Whaticket</th><th className="pb-2 text-right">Whatmeta</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} className="border-t border-black-5">
                  <td className="py-1.5 text-xs text-black-85 font-medium">{r.label}</td>
                  <td className="py-1.5 text-right px-2 text-xs text-[#475569]">{r.fmt(r.whaticket as any)}</td>
                  <td className="py-1.5 text-right text-xs text-[#475569]">{r.fmt(r.whatmeta as any)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  EVOLUCIÓN COMPARADA                                            */
/* ════════════════════════════════════════════════════════════════ */
function EvolucionComparada({ items }: { items: ResWhatsApp["evolucion"] }) {
  const [grupo, setGrupo] = useState<"hora" | "dia" | "semana" | "mes">("dia");
  const muted = "#94A3B8";

  const { periodos, whaticket, whatmeta } = useMemo(() => {
    const raw = grupo === "dia" || grupo === "hora" ? items : (() => {
      const m = new Map<string, Map<string, number>>();
      for (const e of items) {
        const d = new Date(e.periodo + "T00:00:00Z");
        let k: string;
        if (grupo === "semana") { const w = new Date(d); w.setDate(d.getDate() - d.getDay()); k = w.toISOString().slice(0, 10); }
        else k = e.periodo.slice(0, 7);
        if (!m.has(k)) m.set(k, new Map());
        m.get(k)!.set(e.subcanal, (m.get(k)!.get(e.subcanal) ?? 0) + e.total);
      }
      const r: { periodo: string; subcanal: string; total: number }[] = [];
      for (const [p, map] of m) for (const [sc, t] of map) r.push({ periodo: p, subcanal: sc, total: t });
      return r.sort((a, b) => a.periodo.localeCompare(b.periodo));
    })();

    const ps = [...new Set(raw.map(i => i.periodo))].sort();
    const wt = ps.map(p => raw.find(i => i.periodo === p && i.subcanal.toLowerCase().includes("ticket"))?.total ?? 0);
    const wm = ps.map(p => raw.find(i => i.periodo === p && i.subcanal.toLowerCase().includes("meta"))?.total ?? 0);
    return { periodos: ps, whaticket: wt, whatmeta: wm };
  }, [items, grupo]);

  const opt = {
    tooltip: { trigger: "axis" as const, formatter: (ps: { seriesName: string; value: number; axisValue: string }[]) => [`<b>${ps[0]?.axisValue}</b>`, ...ps.map(p => `${p.seriesName}: <b>${fmtNum(p.value)}</b>`)].join("<br/>") },
    legend: { data: ["Whaticket", "Whatmeta"], bottom: 0, textStyle: { color: muted } },
    grid: { left: 50, right: 20, top: 15, bottom: 55 },
    xAxis: { type: "category" as const, data: periodos, axisLabel: { color: muted, fontSize: 10, rotate: periodos.length > 20 ? 45 : 0 } },
    yAxis: { type: "value" as const, axisLabel: { color: muted }, splitLine: { lineStyle: { color: "#E2E8F0", type: "dashed" as const } } },
    series: [
      { name: "Whaticket", type: "line" as const, smooth: true, data: whaticket, lineStyle: { color: "#3b82f6", width: 2.5 }, itemStyle: { color: "#3b82f6" }, symbol: "circle" as const, symbolSize: 4 },
      { name: "Whatmeta", type: "line" as const, smooth: true, data: whatmeta, lineStyle: { color: "#22c55e", width: 2.5 }, itemStyle: { color: "#22c55e" }, symbol: "circle" as const, symbolSize: 4 },
    ],
  };

  const BTN = ({ v, label }: { v: typeof grupo; label: string }) => (
    <button onClick={() => setGrupo(v)} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", grupo === v ? "bg-primary text-white" : "bg-light text-black-45 hover:text-black-85")}>{label}</button>
  );

  return (
    <Section title="Evolución Whaticket vs Whatmeta" subtitle="¿Meta está creciendo?">
      <div className="mb-3 flex gap-1">{(["hora","dia","semana","mes"] as const).map(v => <BTN key={v} v={v} label={{h:"Hora",d:"Día",s:"Semana",m:"Mes"}[v[0] as "h"|"d"|"s"|"m"]} />)}</div>
      <ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate />
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  HEATMAP HORA CON TOGGLE                                        */
/* ════════════════════════════════════════════════════════════════ */
function HeatmapHoraToggle({ items }: { items: ResWhatsApp["heatmapHora"] }) {
  const [filtro, setFiltro] = useState<"all" | "ticket" | "meta">("all");
  const muted = "#94A3B8"; const textColor = "#1E293B";
  const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const horas = Array.from({ length: 24 }, (_, i) => i);

  const filtered = useMemo(() => {
    if (filtro === "all") return items;
    return items.filter(i => filtro === "ticket" ? i.subcanal.toLowerCase().includes("ticket") : i.subcanal.toLowerCase().includes("meta"));
  }, [items, filtro]);

  const maxV = Math.max(...filtered.map(i => i.total), 1);
  const data = horas.flatMap(h => dias.map((_, d) => [h, d, filtered.find(i => i.hora === h && i.dia === d)?.total ?? 0] as number[]));

  const opt = {
    tooltip: { formatter: (p: { value: number[] }) => `${dias[p.value[1]]} ${String(p.value[0]).padStart(2,"0")}:00<br/>Conversaciones: <b>${p.value[2]}</b>` },
    grid: { left: 50, right: 20, top: 10, bottom: 60 },
    xAxis: { type: "category" as const, data: dias, axisLabel: { color: muted } },
    yAxis: { type: "category" as const, data: horas.map(h => `${String(h).padStart(2,"0")}:00`), axisLabel: { color: textColor, fontSize: 9 } },
    visualMap: { min: 0, max: maxV, calculable: true, orient: "horizontal", left: "center", bottom: 10, inRange: { color: ["#FFF7ED", "#FED7AA", "#F97316"] } },
    series: [{ type: "heatmap" as const, data, label: { show: false } }],
  };

  const BTN = ({ v, label }: { v: typeof filtro; label: string }) => (
    <button onClick={() => setFiltro(v)} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", filtro === v ? "bg-primary text-white" : "bg-light text-black-45 hover:text-black-85")}>{label}</button>
  );

  return (
    <Section title="Mapa de calor: hora vs día" subtitle="Alternar entre Whaticket / Whatmeta / Ambos">
      <div className="mb-3 flex gap-1"><BTN v="all" label="Ambos" /><BTN v="ticket" label="Whaticket" /><BTN v="meta" label="Whatmeta" /></div>
      <ReactECharts option={opt} style={{ height: 340 }} notMerge lazyUpdate />
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PARETO CATEGORÍAS                                              */
/* ════════════════════════════════════════════════════════════════ */
function ParetoCategorias({ items }: { items: ResWhatsApp["treemap"] }) {
  const muted = "#94A3B8"; const primary = "#F97316";
  const withPct = useMemo(() => {
    const total = items.reduce((s, i) => s + i.total, 0);
    let acum = 0;
    return items.map(i => { acum += i.total; return { ...i, pct: total > 0 ? Math.round(i.total / total * 1000) / 10 : 0, acumulado: total > 0 ? Math.round(acum / total * 1000) / 10 : 0 }; });
  }, [items]);

  const opt = {
    tooltip: { trigger: "axis" as const, axisPointer: { type: "cross" as const }, formatter: (ps: { dataIndex: number }[]) => { const i = withPct[ps[0]?.dataIndex]; if (!i) return ""; return [`<b>${i.categoria}</b>`, `Volumen: <b>${fmtNum(i.total)}</b>`, `%: ${i.pct}%`, `% Acumulado: ${i.acumulado}%`, `Resolución: ${fmtDur(i.tiempoResolucion)}`].join("<br/>"); } },
    grid: { left: 60, right: 60, top: 30, bottom: 70 },
    xAxis: { type: "category" as const, data: withPct.map(i => i.categoria), axisLabel: { color: muted, fontSize: 10, rotate: 30, interval: 0 } },
    yAxis: [
      { type: "value" as const, name: "Volumen", axisLabel: { color: muted }, splitLine: { lineStyle: { color: "#E2E8F0", type: "dashed" as const } } },
      { type: "value" as const, name: "% Acumulado", max: 100, axisLabel: { color: muted, formatter: "{value}%" }, splitLine: { show: false } },
    ],
    series: [
      { type: "bar" as const, data: withPct.map(i => i.total), itemStyle: { color: primary }, barMaxWidth: 28, label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? fmtNum(p.value) : "", color: muted, fontSize: 9 } },
      { type: "line" as const, yAxisIndex: 1, data: withPct.map(i => i.acumulado), smooth: true, lineStyle: { color: "#ef4444", width: 2 }, itemStyle: { color: "#ef4444" }, areaStyle: { color: "rgba(239,68,68,0.1)" }, label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? `${p.value}%` : "", color: "#ef4444", fontSize: 9 } },
    ],
  };
  return <Section title="Pareto de categorías" subtitle="Barras = volumen · Línea = % acumulado"><ReactECharts option={opt} style={{ height: 360 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  PARETO SUBCATEGORÍAS                                           */
/* ════════════════════════════════════════════════════════════════ */
function ParetoSubcategorias({ items }: { items: ResWhatsApp["topSubcategorias"] }) {
  const muted = "#94A3B8"; const primary = "#F97316";
  const top = items.slice(0, 20);
  const withAcum = useMemo(() => { let a = 0; return top.map(i => { a += i.total; return { ...i, acumulado: a }; }); }, [top]);

  const opt = {
    tooltip: { trigger: "axis" as const, axisPointer: { type: "cross" as const }, formatter: (ps: { dataIndex: number }[]) => { const i = withAcum[ps[0]?.dataIndex]; if (!i) return ""; return [`<b>${i.subcategoria}</b>`, `Volumen: <b>${fmtNum(i.total)}</b>`, `%: ${i.porcentaje}%`, `% Acumulado: ${i.acumulado}%`].join("<br/>"); } },
    grid: { left: 60, right: 60, top: 30, bottom: 70 },
    xAxis: { type: "category" as const, data: withAcum.map(i => i.subcategoria), axisLabel: { color: muted, fontSize: 10, rotate: 30, interval: 0 } },
    yAxis: [
      { type: "value" as const, name: "Volumen", axisLabel: { color: muted }, splitLine: { lineStyle: { color: "#E2E8F0", type: "dashed" as const } } },
      { type: "value" as const, name: "% Acumulado", max: 100, axisLabel: { color: muted, formatter: "{value}%" }, splitLine: { show: false } },
    ],
    series: [
      { type: "bar" as const, data: withAcum.map(i => i.total), itemStyle: { color: primary }, barMaxWidth: 28, label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? fmtNum(p.value) : "", color: muted, fontSize: 9 } },
      { type: "line" as const, yAxisIndex: 1, data: withAcum.map(i => i.acumulado), smooth: true, lineStyle: { color: "#ef4444", width: 2 }, itemStyle: { color: "#ef4444" }, areaStyle: { color: "rgba(239,68,68,0.1)" }, label: { show: true, position: "top" as const, formatter: (p: { value: number }) => p.value ? `${p.value}%` : "", color: "#ef4444", fontSize: 9 } },
    ],
  };
  return <Section title="Pareto de subcategorías" subtitle="Top 20"><ReactECharts option={opt} style={{ height: 360 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAÍS → CATEGORÍA → ASESOR                                      */
/* ════════════════════════════════════════════════════════════════ */
function PaisJerarquia({ paisItems, asesorItems }: { paisItems: ResWhatsApp["paisCat"]; asesorItems: ResWhatsApp["asesores"] }) {
  const [selectedPais, setSelectedPais] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  const paises = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of paisItems) map.set(r.pais, (map.get(r.pais) ?? 0) + r.total);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [paisItems]);

  const categorias = useMemo(() => {
    if (!selectedPais) return [];
    const map = new Map<string, number>();
    for (const r of paisItems) { if (r.pais === selectedPais) map.set(r.categoria, (map.get(r.categoria) ?? 0) + r.total); }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [paisItems, selectedPais]);

    const asesores = useMemo(() => {
    if (!selectedPais || !selectedCategoria) return [];
    return asesorItems.filter(a => a.total > 0).sort((a: { total: number }, b: { total: number }) => b.total - a.total).slice(0, 15);
  }, [asesorItems, selectedPais, selectedCategoria]);

  return (
    <Section title="País → Categoría → Asesor" subtitle="Seleccione un país para explorar">
      <div className="flex gap-6">
        <div className="w-2/5 max-h-72 overflow-y-auto border-r border-black-10 pr-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45"><th className="pb-2 pr-2">País</th><th className="pb-2 text-right">Volumen</th></tr></thead>
            <tbody>{paises.map(([pais, total]) => (
              <tr key={pais} onClick={() => { setSelectedPais(pais); setSelectedCategoria(null); }}
                className={`border-t border-black-5 cursor-pointer transition-colors hover:bg-light ${selectedPais === pais ? "bg-primary-10 font-semibold" : ""}`}>
                <td className="py-1.5 pr-2 text-xs text-black-85">{pais}</td><td className="py-1.5 text-right text-xs text-[#475569]">{fmtNum(total)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex-1 max-h-72 overflow-y-auto">
          {!selectedPais && <p className="text-sm text-black-25 py-8 text-center">Seleccione un país.</p>}
          {selectedPais && !selectedCategoria && (
            <div>
              <div className="text-xs text-black-25 mb-2">{selectedPais} / Categorías</div>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45"><th className="pb-2 pr-2">Categoría</th><th className="pb-2 text-right">Volumen</th></tr></thead>
                <tbody>{categorias.map(([cat, total]) => (
                  <tr key={cat} onClick={() => setSelectedCategoria(cat)} className="border-t border-black-5 cursor-pointer hover:bg-light">
                    <td className="py-1.5 pr-2 text-xs text-black-85">{cat}</td><td className="py-1.5 text-right text-xs text-[#475569]">{fmtNum(total)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {selectedPais && selectedCategoria && (
            <div>
              <div className="text-xs text-black-25 mb-2"><button onClick={() => setSelectedCategoria(null)} className="text-primary hover:underline">← {selectedPais}</button> / {selectedCategoria} / Asesores</div>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45"><th className="pb-2 pr-2">Asesor</th><th className="pb-2 pr-2 text-right">Volumen</th><th className="pb-2 text-right">SLA</th></tr></thead>
                <tbody>{asesores.map(a => (
                  <tr key={a.asesor} className="border-t border-black-5">
                    <td className="py-1.5 pr-2 text-xs text-black-85">{a.asesor}</td><td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtNum(a.total)}</td>
                    <td className="py-1.5 text-right text-xs"><Badge value={a.sla} goodAbove={80} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PANEL DE RIESGOS                                               */
/* ════════════════════════════════════════════════════════════════ */
function PanelRiesgos({ items }: { items: ResWhatsApp["asesores"] }) {
  const riesgo = useMemo(() => {
    const grouped = new Map<string, { total: number; tiempoPromedio: number; sla: number; abiertos: number; pendientes: number; n: number }>();
    for (const r of items) {
      const e = grouped.get(r.asesor) ?? { total: 0, tiempoPromedio: 0, sla: 0, abiertos: 0, pendientes: 0, n: 0 };
      e.total += r.total; e.tiempoPromedio += (r.tiempoPromedio ?? 0) * r.total; e.sla += (r.sla ?? 0) * r.total; e.abiertos += r.abiertos; e.pendientes += r.pendientes; e.n += r.total;
      grouped.set(r.asesor, e);
    }
    const maxVol = Math.max(...[...grouped.values()].map(e => e.total), 1);
    return [...grouped.entries()].map(([asesor, e]) => {
      const promRes = e.n > 0 ? e.tiempoPromedio / e.n : 0;
      const slaAvg = e.total > 0 ? e.sla / e.total : 0;
      const volScore = (e.total / maxVol) * 40;
      const resScore = (1 - (promRes / (promRes + 60))) * 30;
      const slaScore = slaAvg / 100 * 30;
      const score = Math.round(volScore + resScore + slaScore);
      const nivel = score >= 80 ? "Crítico" : score >= 60 ? "Alto" : score >= 40 ? "Medio" : "Bajo";
      return { asesor, score, total: e.total, tiempoPromedio: promRes, sla: slaAvg, abiertos: e.abiertos, pendientes: e.pendientes, nivel };
    }).sort((a, b) => b.score - a.score);
  }, [items]);

  const nivelColor = (n: string) => n === "Crítico" ? "text-danger bg-danger-5" : n === "Alto" ? "text-warning bg-orange-50" : n === "Medio" ? "text-yellow-600 bg-yellow-5" : "text-success bg-success-5";

  return (
    <Section title="Panel de Riesgos" subtitle="Score: 40% Vol + 30% Res + 30% SLA">
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
            <th className="pb-2 pr-2">Asesor</th><th className="pb-2 pr-2 text-right">Nivel</th><th className="pb-2 pr-2 text-right">Score</th>
            <th className="pb-2 pr-2 text-right">Pendientes</th><th className="pb-2 pr-2 text-right">Resolución</th><th className="pb-2 text-right">SLA</th>
          </tr></thead>
          <tbody>{riesgo.slice(0, 15).map(r => (
            <tr key={r.asesor} className="border-t border-black-5">
              <td className="py-1.5 pr-2 text-xs font-medium text-black-85">{r.asesor}</td>
              <td className="py-1.5 pr-2 text-right text-xs"><span className={`inline-block rounded px-2 py-0.5 font-semibold ${nivelColor(r.nivel)}`}>{r.nivel}</span></td>
              <td className="py-1.5 pr-2 text-right text-xs font-bold text-black-85">{r.score}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{r.pendientes}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(r.tiempoPromedio)}</td>
              <td className="py-1.5 text-right text-xs"><Badge value={Math.round(r.sla)} goodAbove={80} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                            */
/* ════════════════════════════════════════════════════════════════ */
export default function WhatsApp() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp", params],
    queryFn: () => fetchData(params),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" /></div>;
  if (!data) return <p className="text-black-25 p-6">Error al cargar datos.</p>;

  const k = data.kpis;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div><h1 className="text-xl font-bold text-black-85">WhatsApp</h1><p className="mt-1 text-sm text-black-45">Análisis operativo del canal WhatsApp</p></div>

      {/* KPI Row 1 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<MessageCircle size={18} />} label="Total conversaciones" value={fmtNum(k.totalConversaciones)}
          hint={`${fmtNum(k.totalWhaticket)} Whaticket · ${fmtNum(k.totalWhatmeta)} Whatmeta`} />
        <KpiCard icon={<Smartphone size={18} />} label="Whaticket" value={fmtPct(k.pctWhaticket)}
          hint={`${fmtNum(k.totalWhaticket)} conversaciones`} color="text-[#3b82f6]" />
        <KpiCard icon={<Monitor size={18} />} label="Whatmeta" value={fmtPct(k.pctWhatmeta)}
          hint={`${fmtNum(k.totalWhatmeta)} conversaciones`} color="text-[#22c55e]" />
        <KpiCard icon={<Clock size={18} />} label="1ª respuesta" value={fmtDur(k.tiempoPrimeraRespuesta)} color="text-[#128C7E]" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Clock size={18} />} label="Resolución" value={fmtDur(k.tiempoResolucion)}
          color={(k.tiempoResolucion ?? 0) > 60 ? "text-danger" : "text-success"} />
        <KpiCard icon={<Clock size={18} />} label="Espera promedio" value={fmtDur(k.tiempoEspera)} color="text-warning" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Cumplimiento SLA" value={fmtPct(k.cumplimientoSla)}
          color={(k.cumplimientoSla ?? 0) >= 80 ? "text-success" : (k.cumplimientoSla ?? 0) >= 50 ? "text-warning" : "text-danger"} />
        <KpiCard icon={<Target size={18} />} label="FCR" value={fmtPct(k.fcr)}
          color={(k.fcr ?? 0) >= 80 ? "text-success" : (k.fcr ?? 0) >= 50 ? "text-warning" : "text-danger"} />
      </div>

      {/* KPI Row 3 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon={<BarChart3 size={18} />} label="Conversaciones abiertas" value={fmtNum(k.conversacionesAbiertas)} color="text-warning" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Conversaciones cerradas" value={fmtNum(k.conversacionesCerradas)} color="text-success" />
        <KpiCard icon={<AlertTriangle size={18} />} label="SLA 1ª respuesta" value={fmtPct(k.cumplimientoSla)}
          color={(k.cumplimientoSla ?? 0) >= 80 ? "text-success" : "text-danger"} />
      </div>

      {/* Comparativa Subcanal */}
      <ComparativaSubcanal items={data.distSubcanal} />

      {/* Evolución */}
      <EvolucionComparada items={data.evolucion} />

      {/* Heatmap Hora */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HeatmapHoraToggle items={data.heatmapHora} />
        <PaisJerarquia paisItems={data.paisCat} asesorItems={data.asesores} />
      </div>

      {/* Pareto Categorías | Pareto Subcategorías */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ParetoCategorias items={data.treemap} />
        <ParetoSubcategorias items={data.topSubcategorias} />
      </div>

      {/* Ranking Asesores | Panel Riesgos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Ranking de asesores" subtitle="Volumen, tiempos, SLA y FCR">
          <DataTable
            columns={[
              { key: "asesor", label: "Asesor", render: (r) => <span className="font-medium text-black-85">{r.asesor}</span> },
              { key: "subcanal", label: "Subcanal", render: (r) => <span className="text-black-45">{r.subcanal}</span> },
              { key: "total", label: "Volumen", align: "right", render: (r) => fmtNum(r.total as number) },
              { key: "tiempoPromedio", label: "Resolución", align: "right", render: (r) => fmtDur(r.tiempoPromedio as number | null) },
              { key: "sla", label: "SLA", align: "right", render: (r) => <Badge value={r.sla as number | null} goodAbove={80} /> },
              { key: "fcr", label: "FCR", align: "right", render: (r) => <Badge value={r.fcr as number | null} goodAbove={80} /> },
              { key: "abiertos", label: "Abiertos", align: "right", render: (r) => <span className="text-warning">{r.abiertos as number}</span> },
              { key: "pendientes", label: "Pend.", align: "right", render: (r) => <span className="text-danger">{r.pendientes as number}</span> },
            ]}
            data={data.asesores.filter(a => ASESORES_OFICIALES.includes(a.asesor))}
          />
        </Section>
        <PanelRiesgos items={data.asesores.filter(a => ASESORES_OFICIALES.includes(a.asesor))} />
      </div>

      {/* Conversaciones largas */}
      {data.conversacionesLargas.length > 0 && (
        <Section title="Conversaciones más largas">
          <DataTable columns={[
            { key: "cliente", label: "Cliente", render: (r) => <span className="font-medium text-black-85">{r.cliente}</span> },
            { key: "asesor", label: "Asesor", render: (r) => <span className="text-black-45">{r.asesor}</span> },
            { key: "subcanal", label: "Subcanal", render: (r) => <span className="text-black-45">{r.subcanal}</span> },
            { key: "tiempoResolucion", label: "Resolución", align: "right", render: (r) => <span className="font-medium text-black-85">{fmtDur(r.tiempoResolucion as number | null)}</span> },
            { key: "fecha", label: "Fecha", align: "right", render: (r) => <span className="text-black-45">{r.fecha}</span> },
          ]} data={data.conversacionesLargas} />
        </Section>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <Section title="Insights automáticos">
          <ul className="space-y-2">
            {data.insights.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2.5 rounded-xl bg-light p-3 text-sm text-black-85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{idx + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </motion.div>
  );
}
