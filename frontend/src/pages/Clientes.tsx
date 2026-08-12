import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Globe, AlertTriangle, Phone, Mail, Search, Download, BarChart3 } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, fmtPct, fmtDur, KpiCard, Section } from "@/components/dashboard/shared";

/* ─── Tipos ─── */
interface ClientesV2Response {
  kpis: { unicos: number; totalAtenciones: number; conDominio: number; pctConDominio: number; sinDominio: number; pctSinDominio: number; wpp: number; pctWpp: number; correo: number; pctCorreo: number; promedioAtenciones: number };
  jerarquia: { cliente: string; canal: string; categoria: string; subcategoria: string; total: number; tiempo_espera: number | null; tiempo_resolucion: number | null; sla: number | null }[];
  ranking: { cliente: string; total: number; pct: number; tiempo_espera: number | null; tiempo_resolucion: number | null; sla: number | null }[];
  rankingTiempo: { cliente: string; tiempo_resolucion: number | null; total: number; sla: number | null }[];
  rankingSLA: { cliente: string; sla: number | null; total: number; tiempo_resolucion: number | null }[];
  riesgo: { cliente: string; score: number; total: number; tiempo_resolucion: number | null; sla: number | null; nivel: string }[];
  evolucion: { cliente: string; periodo: string; total: number }[];
}

async function fetchData(params: Record<string, string>): Promise<ClientesV2Response> {
  const { data } = await api.get("/dashboard/clientes-v2", { params });
  return data.data as ClientesV2Response;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function ValidatedChart({ data, required, title, subtitle, children }: { data: unknown; required: string[]; title: string; subtitle?: string; children: React.ReactNode }) {
  const arr = Array.isArray(data) ? data : null;
  useEffect(() => {
    if (!arr) { console.warn(`⚠️ [${title}] dataset vacío`); return; }
    if (!arr.length) { console.warn(`⚠️ [${title}] 0 registros`); return; }
    const missing = required.filter(f => !(f in (arr[0] as Record<string, unknown>)));
    if (missing.length) console.error(`❌ [${title}] faltan: ${missing.join(", ")}`);
  }, [arr, required, title]);
  if (!arr?.length) return <Section title={title} subtitle={subtitle}><p className="text-sm text-black-25 py-8 text-center">Sin información para el rango seleccionado.</p></Section>;
  const missing = required.filter(f => !(f in (arr[0] as Record<string, unknown>)));
  if (missing.length) return <Section title={title} subtitle={subtitle}><p className="text-sm text-danger py-4">Error: propiedad(es) faltante(s): {missing.join(", ")}</p></Section>;
  return <Section title={title} subtitle={subtitle}>{children}</Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  1. CARDS (6)                                                   */
/* ════════════════════════════════════════════════════════════════ */
function KpisRow({ k }: { k: ClientesV2Response["kpis"] }) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard icon={<Users size={18} />} label="Clientes únicos" value={fmtNum(k.unicos)} hint={`${fmtNum(k.totalAtenciones)} atenciones`} />
      <KpiCard icon={<Globe size={18} />} label="Con dominio" value={fmtNum(k.conDominio)} hint={`${fmtPct(k.pctConDominio)} del total`} />
      <KpiCard icon={<AlertTriangle size={18} />} label="Sin dominio" value={fmtNum(k.sinDominio)} hint={`${fmtPct(k.pctSinDominio)} del total`} />
      <KpiCard icon={<Phone size={18} />} label="WhatsApp" value={fmtNum(k.wpp)} hint={`${fmtPct(k.pctWpp)} de clientes`} />
      <KpiCard icon={<Mail size={18} />} label="Correo" value={fmtNum(k.correo)} hint={`${fmtPct(k.pctCorreo)} de clientes`} />
      <KpiCard icon={<BarChart3 size={18} />} label="Prom atenciones x cliente" value={fmtNum(k.promedioAtenciones)} hint="atenciones por cliente" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  2. JERARQUÍA CLIENTE (tipo País)                               */
/* ════════════════════════════════════════════════════════════════ */
interface JerarquiaProps {
  items: ClientesV2Response["jerarquia"];
  selectedCliente: string | null;
  selectedCategoria: string | null;
  onSelectCliente: (c: string | null) => void;
  onSelectCategoria: (c: string | null) => void;
}

function JerarquiaCliente({ items, selectedCliente, selectedCategoria, onSelectCliente, onSelectCategoria }: JerarquiaProps) {
  const [search, setSearch] = useState("");

  const clientes = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of items) map.set(r.cliente, (map.get(r.cliente) ?? 0) + r.total);
    return [...map.entries()]
      .filter(([c]) => c.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[1] - a[1]);
  }, [items, search]);

  const categorias = useMemo(() => {
    if (!selectedCliente) return [];
    const map = new Map<string, { total: number; tiempo_espera: number; tiempo_resolucion: number; sla: number; n: number }>();
    for (const r of items) {
      if (r.cliente !== selectedCliente) continue;
      const e = map.get(r.categoria) ?? { total: 0, tiempo_espera: 0, tiempo_resolucion: 0, sla: 0, n: 0 };
      e.total += r.total;
      if (r.tiempo_espera != null) { e.tiempo_espera += r.tiempo_espera * r.total; e.n += r.total; }
      if (r.tiempo_resolucion != null) e.tiempo_resolucion += r.tiempo_resolucion * r.total;
      if (r.sla != null) e.sla += r.sla * r.total;
      map.set(r.categoria, e);
    }
    return [...map.entries()].map(([cat, e]) => ({
      categoria: cat, total: e.total,
      tiempo_espera: e.n > 0 ? e.tiempo_espera / e.n : null,
      tiempo_resolucion: e.total > 0 ? e.tiempo_resolucion / e.total : null,
      sla: e.total > 0 ? e.sla / e.total : null,
    })).sort((a, b) => b.total - a.total);
  }, [items, selectedCliente]);

  const subcategorias = useMemo(() => {
    if (!selectedCliente || !selectedCategoria) return [];
    return items.filter(r => r.cliente === selectedCliente && r.categoria === selectedCategoria).sort((a, b) => b.total - a.total);
  }, [items, selectedCliente, selectedCategoria]);

  const exportCSV = useCallback(() => {
    const rows = [["Cliente", "Canal", "Categoria", "Subcategoria", "Cantidad", "Tiempo Espera", "Tiempo Resolucion", "SLA"]];
    for (const r of items) rows.push([r.cliente, r.canal, r.categoria, r.subcategoria, String(r.total), String(r.tiempo_espera ?? ""), String(r.tiempo_resolucion ?? ""), String(r.sla ?? "")]);
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clientes.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  if (!items.length) return null;

  const totalCliente = selectedCliente ? clientes.find(([c]) => c === selectedCliente)?.[1] ?? 0 : 0;
  const catTotal = selectedCategoria ? categorias.find(c => c.categoria === selectedCategoria)?.total ?? 0 : 0;

  return (
    <Section title="Explorador de Clientes" subtitle="Cliente → Categoría → Subcategoría. Seleccione un cliente para explorar.">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black-25" />
          <input type="text" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-black-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]/30" />
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-black-45 hover:text-primary transition-colors">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left panel: client list */}
        <div className="w-2/5 max-h-[520px] overflow-y-auto border-r border-black-10 pr-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
                <th className="pb-2 pr-2">Cliente</th><th className="pb-2 text-right">Volumen</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(([cliente, total]) => (
                <tr key={cliente} onClick={() => { onSelectCliente(selectedCliente === cliente ? null : cliente); onSelectCategoria(null); }}
                  className={`border-t border-black-5 cursor-pointer transition-colors hover:bg-light ${selectedCliente === cliente ? "bg-primary-10 font-semibold" : ""}`}>
                  <td className="py-1.5 pr-2 text-xs text-black-85">{cliente}</td>
                  <td className="py-1.5 text-right text-xs text-[#475569]">{fmtNum(total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right panel: drill-down */}
        <div className="flex-1 max-h-[520px] overflow-y-auto">
          {!selectedCliente && (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <Users size={40} className="text-black-10 mb-3" />
              <p className="text-sm text-black-25">Seleccione un cliente para visualizar su análisis.</p>
            </div>
          )}

          {selectedCliente && !selectedCategoria && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="font-semibold text-black-85">{selectedCliente}</span>
                <span className="text-black-25">/ Categorías</span>
              </div>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
                    <th className="pb-2 pr-2">Categoría</th><th className="pb-2 pr-2 text-right">Cantidad</th>
                    <th className="pb-2 pr-2 text-right">%</th><th className="pb-2 pr-2 text-right">T. Espera</th>
                    <th className="pb-2 pr-2 text-right">T. Resolución</th><th className="pb-2 text-right">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(c => (
                    <tr key={c.categoria} onClick={() => onSelectCategoria(c.categoria)}
                      className="border-t border-black-5 cursor-pointer hover:bg-light">
                      <td className="py-1.5 pr-2 text-xs font-medium text-black-85">{c.categoria}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtNum(c.total)}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{totalCliente > 0 ? fmtPct((c.total / totalCliente) * 100) : "—"}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(c.tiempo_espera)}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(c.tiempo_resolucion)}</td>
                      <td className="py-1.5 text-right text-xs"><span className={`inline-block rounded px-1.5 py-0.5 font-semibold ${c.sla != null && c.sla >= 80 ? "bg-success-5 text-success" : "bg-danger-5 text-danger"}`}>{fmtPct(c.sla)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedCliente && selectedCategoria && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm">
                <button onClick={() => onSelectCategoria(null)} className="text-primary hover:underline">← {selectedCliente}</button>
                <span className="text-black-25">/ {selectedCategoria} / Subcategorías</span>
              </div>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
                    <th className="pb-2 pr-2">Subcategoría</th><th className="pb-2 pr-2 text-right">Cantidad</th>
                    <th className="pb-2 pr-2 text-right">%</th><th className="pb-2 pr-2 text-right">T. Espera</th>
                    <th className="pb-2 pr-2 text-right">T. Resolución</th><th className="pb-2 text-right">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {subcategorias.map(s => (
                    <tr key={s.subcategoria} className="border-t border-black-5">
                      <td className="py-1.5 pr-2 text-xs text-black-85">{s.subcategoria}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtNum(s.total)}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{catTotal > 0 ? fmtPct((s.total / catTotal) * 100) : "—"}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(s.tiempo_espera)}</td>
                      <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(s.tiempo_resolucion)}</td>
                      <td className="py-1.5 text-right text-xs"><span className={`inline-block rounded px-1.5 py-0.5 font-semibold ${s.sla != null && s.sla >= 80 ? "bg-success-5 text-success" : "bg-danger-5 text-danger"}`}>{fmtPct(s.sla)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  3. RANKING (tabla)                                              */
/* ════════════════════════════════════════════════════════════════ */
function RankingTable({ items }: { items: ClientesV2Response["ranking"] }) {
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
            <th className="pb-2 pr-2">#</th><th className="pb-2 pr-2">Cliente</th>
            <th className="pb-2 pr-2 text-right">Atenciones</th><th className="pb-2 pr-2 text-right">%</th>
            <th className="pb-2 pr-2 text-right">Resolución</th><th className="pb-2 text-right">SLA</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={r.cliente} className="border-t border-black-5">
              <td className="py-1.5 pr-2 text-xs text-black-25">{i + 1}</td>
              <td className="py-1.5 pr-2 text-xs font-medium text-black-85">{r.cliente}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtNum(r.total)}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{r.pct}%</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(r.tiempo_resolucion)}</td>
              <td className="py-1.5 text-right text-xs"><span className={`inline-block rounded px-1.5 py-0.5 font-semibold ${r.sla != null && r.sla >= 80 ? "bg-success-5 text-success" : "bg-danger-5 text-danger"}`}>{fmtPct(r.sla)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  4. RIESGO                                                       */
/* ════════════════════════════════════════════════════════════════ */
function RiesgoTable({ items }: { items: ClientesV2Response["riesgo"] }) {
  const nivelColor = (n: string) => n === "Crítico" ? "text-danger bg-danger-5" : n === "Alto" ? "text-warning bg-orange-50" : n === "Medio" ? "text-yellow-600 bg-yellow-5" : "text-success bg-success-5";
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
            <th className="pb-2 pr-2">Cliente</th><th className="pb-2 pr-2 text-right">Score</th>
            <th className="pb-2 pr-2 text-right">Atenciones</th><th className="pb-2 pr-2 text-right">Resolución</th>
            <th className="pb-2 pr-2 text-right">SLA</th><th className="pb-2 text-right">Nivel</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 20).map(r => (
            <tr key={r.cliente} className="border-t border-black-5">
              <td className="py-1.5 pr-2 text-xs font-medium text-black-85">{r.cliente}</td>
              <td className="py-1.5 pr-2 text-right text-xs font-bold text-black-85">{r.score}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtNum(r.total)}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtDur(r.tiempo_resolucion)}</td>
              <td className="py-1.5 pr-2 text-right text-xs text-[#475569]">{fmtPct(r.sla)}</td>
              <td className="py-1.5 text-right text-xs"><span className={`inline-block rounded px-2 py-0.5 font-semibold ${nivelColor(r.nivel)}`}>{r.nivel}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  5. CATEGORÍAS DEL CLIENTE SELECCIONADO                          */
/* ════════════════════════════════════════════════════════════════ */
function CategoriasClienteBar({ items, cliente }: { items: ClientesV2Response["jerarquia"]; cliente: string }) {
  const muted = cssVar("--muted"); const textColor = cssVar("--text"); const primary = cssVar("--primary");
  const data = useMemo(() => {
    const map = new Map<string, { total: number; tiempo_resolucion: number; sla: number; n: number }>();
    for (const r of items) {
      if (r.cliente !== cliente) continue;
      const e = map.get(r.categoria) ?? { total: 0, tiempo_resolucion: 0, sla: 0, n: 0 };
      e.total += r.total;
      if (r.tiempo_resolucion != null) { e.tiempo_resolucion += r.tiempo_resolucion * r.total; e.n += r.total; }
      if (r.sla != null) e.sla += r.sla * r.total;
      map.set(r.categoria, e);
    }
    return [...map.entries()].map(([cat, e]) => ({ categoria: cat, total: e.total, tiempo_resolucion: e.n > 0 ? e.tiempo_resolucion / e.n : null, sla: e.total > 0 ? e.sla / e.total : null })).sort((a, b) => b.total - a.total);
  }, [items, cliente]);

  const opt = {
    tooltip: { trigger: "axis" as const, formatter: (ps: { dataIndex: number }[]) => { const i = data[ps[0]?.dataIndex]; if (!i) return ""; return [`<b>${i.categoria}</b>`, `Cantidad: ${fmtNum(i.total)}`, `Resolución: ${fmtDur(i.tiempo_resolucion)}`, `SLA: ${fmtPct(i.sla)}`].join("<br/>"); } },
    grid: { left: 180, right: 60, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, axisLabel: { color: muted }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: data.map(i => i.categoria), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{ type: "bar" as const, data: data.map(i => i.total), barMaxWidth: 18, itemStyle: { color: primary, borderRadius: [0, 4, 4, 0] }, label: { show: true, position: "right" as const, formatter: (p: { value: number }) => fmtNum(p.value), color: textColor, fontSize: 9 } }],
  };
  return <ReactECharts option={opt} style={{ height: Math.max(160, data.length * 24 + 40) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  9. SUBCATEGORÍAS DEL CLIENTE Y CATEGORÍA SELECCIONADOS          */
/* ════════════════════════════════════════════════════════════════ */
function SubcategoriasClienteBar({ items, cliente, categoria }: { items: ClientesV2Response["jerarquia"]; cliente: string; categoria: string }) {
  const muted = cssVar("--muted"); const textColor = cssVar("--text"); const primary = cssVar("--primary");
  const data = useMemo(() => {
    return items.filter(r => r.cliente === cliente && r.categoria === categoria)
      .map(r => ({ subcategoria: r.subcategoria, total: r.total, tiempo_resolucion: r.tiempo_resolucion, sla: r.sla }))
      .sort((a, b) => b.total - a.total);
  }, [items, cliente, categoria]);

  const opt = {
    tooltip: { trigger: "axis" as const, formatter: (ps: { dataIndex: number }[]) => { const i = data[ps[0]?.dataIndex]; if (!i) return ""; return [`<b>${i.subcategoria}</b>`, `Cantidad: ${fmtNum(i.total)}`, `Resolución: ${fmtDur(i.tiempo_resolucion)}`, `SLA: ${fmtPct(i.sla)}`].join("<br/>"); } },
    grid: { left: 200, right: 60, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, axisLabel: { color: muted }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: data.map(i => i.subcategoria), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{ type: "bar" as const, data: data.map(i => i.total), barMaxWidth: 18, itemStyle: { color: primary, borderRadius: [0, 4, 4, 0] }, label: { show: true, position: "right" as const, formatter: (p: { value: number }) => fmtNum(p.value), color: textColor, fontSize: 9 } }],
  };
  return <ReactECharts option={opt} style={{ height: Math.max(160, data.length * 22 + 40) }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  10. EVOLUCIÓN DEL CLIENTE SELECCIONADO                          */
/* ════════════════════════════════════════════════════════════════ */
function EvolucionCliente({ items, cliente }: { items: ClientesV2Response["evolucion"]; cliente: string }) {
  const muted = cssVar("--muted");
  const data = useMemo(() => {
    return items.filter(r => r.cliente === cliente).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [items, cliente]);

  const opt = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: "category" as const, data: data.map(i => i.periodo), axisLabel: { color: muted, fontSize: 9, rotate: 30 } },
    yAxis: { type: "value" as const, axisLabel: { color: muted }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    series: [{ type: "line" as const, data: data.map(i => i.total), smooth: true, lineStyle: { color: "#3b82f6", width: 2 }, areaStyle: { color: "rgba(59,130,246,0.1)" }, itemStyle: { color: "#3b82f6" } }],
  };

  if (data.length < 2) return <p className="text-xs text-black-25 py-4 text-center">Se requieren al menos 2 periodos para mostrar evolución.</p>;
  return <ReactECharts option={opt} style={{ height: 200 }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  11. DISTRIBUCIÓN DE CANALES DEL CLIENTE (donut)                 */
/* ════════════════════════════════════════════════════════════════ */
function CanalesClienteDonut({ items, cliente }: { items: ClientesV2Response["jerarquia"]; cliente: string }) {
  const muted = cssVar("--muted");
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of items) { if (r.cliente === cliente) map.set(r.canal, (map.get(r.canal) ?? 0) + r.total); }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [items, cliente]);

  const total = data.reduce((s, d) => s + d.value, 0);

  const opt = {
    tooltip: { trigger: "item" as const, formatter: (p: { name: string; value: number; percent: number }) => `<b>${p.name}</b><br/>Cantidad: ${fmtNum(p.value)} (${p.percent}%)` },
    series: [{
      type: "pie" as const, radius: ["40%", "70%"], avoidLabelOverlap: true,
      label: { show: true, formatter: (p: { name: string; percent: number }) => `${p.name}\n${p.percent}%`, color: muted, fontSize: 10 },
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      data: data.map(d => ({ ...d, itemStyle: { color: d.name === "whatsapp" ? "#22c55e" : d.name === "whaticket" ? "#3b82f6" : "#f59e0b" } })),
    }],
  };

  if (!total) return <p className="text-xs text-black-25 py-4 text-center">Sin datos de canales para este cliente.</p>;
  return <ReactECharts option={opt} style={{ height: 200 }} notMerge lazyUpdate />;
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                            */
/* ════════════════════════════════════════════════════════════════ */
export default function Clientes() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["clientes-v2", params],
    queryFn: () => fetchData(params),
    refetchOnWindowFocus: false,
  });

  const [selectedCliente, setSelectedCliente] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  useEffect(() => { if (data) console.log("📊 Dataset clientes-v2:", JSON.parse(JSON.stringify(data))); }, [data]);

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!data) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center"><p className="text-sm text-black-25">Sin información para el rango seleccionado.</p></motion.div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-lg font-semibold text-text">Análisis de Clientes</h1>

      {/* Cards */}
      <KpisRow k={data.kpis} />

      {/* Jerarquía Cliente */}
      <JerarquiaCliente
        items={data.jerarquia}
        selectedCliente={selectedCliente}
        selectedCategoria={selectedCategoria}
        onSelectCliente={setSelectedCliente}
        onSelectCategoria={setSelectedCategoria}
      />

      {/* Charts condicionales: solo si hay cliente seleccionado */}
      {selectedCliente && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Categorías más frecuentes" subtitle={`Cliente: ${selectedCliente}`}>
            <CategoriasClienteBar items={data.jerarquia} cliente={selectedCliente} />
          </Section>
          <Section title="Distribución de canales" subtitle={`Cliente: ${selectedCliente}`}>
            <CanalesClienteDonut items={data.jerarquia} cliente={selectedCliente} />
          </Section>
        </div>
      )}

      {selectedCliente && (
        <Section title="Evolución de atenciones" subtitle={`Cliente: ${selectedCliente}`}>
          <EvolucionCliente items={data.evolucion} cliente={selectedCliente} />
        </Section>
      )}

      {selectedCliente && selectedCategoria && (
        <Section title="Subcategorías más frecuentes" subtitle={`${selectedCliente} → ${selectedCategoria}`}>
          <SubcategoriasClienteBar items={data.jerarquia} cliente={selectedCliente} categoria={selectedCategoria} />
        </Section>
      )}

      {/* Ranking | Riesgo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ValidatedChart data={data.ranking} required={["cliente", "total", "pct", "tiempo_resolucion", "sla"]} title="Ranking de Clientes" subtitle="Top 20 por volumen">
          <RankingTable items={data.ranking} />
        </ValidatedChart>
        <ValidatedChart data={data.riesgo} required={["cliente", "score", "total", "nivel"]} title="Clientes en Riesgo" subtitle="Score: 40% Vol + 30% Res + 30% SLA">
          <RiesgoTable items={data.riesgo} />
        </ValidatedChart>
      </div>


    </motion.div>
  );
}
