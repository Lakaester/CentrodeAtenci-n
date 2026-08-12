import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { MetricsMatrix } from "@/components/dashboard/metrics/MetricsMatrix";
import { AreaChart } from "@/components/charts";
import { cn } from "@/lib/utils";

import { normalizeCountryName } from "@/lib/countryNames";

export interface PaisRow {
  pais: string;
  wpp_total: number; wpp_en_proceso: number; wpp_cerradas: number;
  wpp_avg_espera: number | null; wpp_avg_atencion: number | null; wpp_avg_total: number | null;
  wpp_sla_esp_1: number; wpp_sla_esp_2: number; wpp_sla_esp_3: number;
  wpp_sla_esp_4: number; wpp_sla_esp_5: number; wpp_sla_esp_t: number;
  wpp_sla_ate_1: number; wpp_sla_ate_2: number; wpp_sla_ate_3: number;
  wpp_sla_ate_4: number; wpp_sla_ate_5: number; wpp_sla_ate_t: number;
  corr_total: number; corr_en_proceso: number; corr_cerradas: number;
  corr_avg_espera: number | null; corr_avg_atencion: number | null; corr_avg_total: number | null;
  corr_sla_pr_1: number; corr_sla_pr_2: number; corr_sla_pr_3: number;
  corr_sla_pr_4: number; corr_sla_pr_5: number; corr_sla_pr_t: number;
  corr_sla_ate_1: number; corr_sla_ate_2: number; corr_sla_ate_3: number;
  corr_sla_ate_4: number; corr_sla_ate_5: number; corr_sla_ate_t: number;
}

export interface PaisCanalFila {
  pais: string;
  canal: string;
  categoria: string;
  total: number;
}

export interface PaisCanalSubFila {
  pais: string;
  canal: string;
  categoria: string;
  subcategoria: string;
  total: number;
}

interface PaisResponse {
  filas: PaisRow[];
  totales: PaisRow;
  paisCanal: PaisCanalFila[];
  paisCanalSub: PaisCanalSubFila[];
}

/* ── Country normalization ── */
const OFFICIAL_ORDER = [
  "PERU", "MEXICO", "COSTA RICA", "CHILE", "COLOMBIA",
  "ECUADOR", "EL SALVADOR", "REPUBLICA DOMINICANA",
  "GUATEMALA", "VENEZUELA", "HONDURAS",
];

function normalizeCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase()
    .replace(/[_-]/g, " ");
  if (!s || s === "SIN PAIS" || s === "UNITED STATES" || s === "USA" || s === "ESTADOS UNIDOS") return null;
  const normalized = normalizeCountryName(s);
  return normalized && OFFICIAL_ORDER.includes(normalized) ? normalized : null;
}

/* ── Merge duplicate countries ── */
const NUMERIC_FIELDS: (keyof PaisRow)[] = [
  "wpp_total", "wpp_en_proceso", "wpp_cerradas",
  "wpp_sla_esp_1", "wpp_sla_esp_2", "wpp_sla_esp_3",
  "wpp_sla_esp_4", "wpp_sla_esp_5", "wpp_sla_esp_t",
  "wpp_sla_ate_1", "wpp_sla_ate_2", "wpp_sla_ate_3",
  "wpp_sla_ate_4", "wpp_sla_ate_5", "wpp_sla_ate_t",
  "corr_total", "corr_en_proceso", "corr_cerradas",
  "corr_sla_pr_1", "corr_sla_pr_2", "corr_sla_pr_3",
  "corr_sla_pr_4", "corr_sla_pr_5", "corr_sla_pr_t",
  "corr_sla_ate_1", "corr_sla_ate_2", "corr_sla_ate_3",
  "corr_sla_ate_4", "corr_sla_ate_5", "corr_sla_ate_t",
];

const AVG_FIELDS: { field: keyof PaisRow; weight: keyof PaisRow }[] = [
  { field: "wpp_avg_espera", weight: "wpp_total" },
  { field: "wpp_avg_atencion", weight: "wpp_total" },
  { field: "wpp_avg_total", weight: "wpp_total" },
  { field: "corr_avg_espera", weight: "corr_total" },
  { field: "corr_avg_atencion", weight: "corr_total" },
  { field: "corr_avg_total", weight: "corr_total" },
];

function weightedAvg(
  rows: PaisRow[],
  field: keyof PaisRow,
  weightField: keyof PaisRow,
): number | null {
  let sum = 0;
  let totalWeight = 0;
  for (const r of rows) {
    const val = r[field];
    const w = r[weightField] as number;
    if (val != null && w > 0) {
      sum += (val as number) * w;
      totalWeight += w;
    }
  }
  return totalWeight > 0 ? sum / totalWeight : null;
}

function createEmptyRow(pais: string): PaisRow {
  const r = { pais } as PaisRow;
  for (const f of NUMERIC_FIELDS) (r as any)[f] = 0;
  for (const { field } of AVG_FIELDS) (r as any)[field] = null;
  return r;
}

function processRows(raw: PaisRow[]): PaisRow[] {
  const groups = new Map<string, PaisRow[]>();
  for (const off of OFFICIAL_ORDER) groups.set(off, []);

  for (const row of raw) {
    const official = normalizeCountry(row.pais);
    if (official && groups.has(official)) groups.get(official)!.push(row);
  }

  const merged: PaisRow[] = [];
  for (const [official, rows] of groups) {
    if (rows.length === 0) {
      merged.push(createEmptyRow(official));
      continue;
    }
    const base = { ...rows[0], pais: official };
    for (const f of NUMERIC_FIELDS) {
      (base as any)[f] = rows.reduce((s, r) => s + ((r[f] as number) || 0), 0);
    }
    for (const { field, weight } of AVG_FIELDS) {
      (base as any)[field] = weightedAvg(rows, field, weight);
    }
    merged.push(base);
  }

  return merged;
}

function computeTotals(filas: PaisRow[]): PaisRow {
  const t: PaisRow = { pais: "TOTAL" } as PaisRow;
  for (const f of NUMERIC_FIELDS) {
    (t as any)[f] = filas.reduce((s, r) => s + ((r[f] as number) || 0), 0);
  }
  for (const { field, weight } of AVG_FIELDS) {
    (t as any)[field] = weightedAvg(filas, field, weight);
  }
  return t;
}

/* ── Fetch ── */
async function fetchPais(params: Record<string, string>): Promise<PaisResponse> {
  const { data } = await api.get("/dashboard/pais", { params });
  return data.data as PaisResponse;
}

/* ── País por Canal — Navegación jerárquica ── */
interface PaisCanalRow {
  pais: string;
  volumen: number;
  pct: string;
}

function PaisCanalTable({
  rows,
  canalRows,
  subRows,
  selectedPais,
  selectedCanal,
  selectedCategoria,
  onSelectPais,
  onSelectCanal,
  onSelectCategoria,
}: {
  rows: PaisCanalRow[];
  canalRows: PaisCanalFila[];
  subRows: PaisCanalSubFila[];
  selectedPais: string | null;
  selectedCanal: string | null;
  selectedCategoria: string | null;
  onSelectPais: (pais: string | null) => void;
  onSelectCanal: (canal: string | null) => void;
  onSelectCategoria: (categoria: string | null) => void;
}) {
  const canales = useMemo(() => {
    if (!selectedPais) return [];
    const map = new Map<string, number>();
    for (const r of canalRows) {
      const official = normalizeCountry(r.pais);
      if (official === selectedPais) {
        map.set(r.canal, (map.get(r.canal) ?? 0) + r.total);
      }
    }
    return Array.from(map.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [canalRows, selectedPais]);

  const categorias = useMemo(() => {
    if (!selectedPais || !selectedCanal) return [];
    const map = new Map<string, number>();
    for (const r of canalRows) {
      const official = normalizeCountry(r.pais);
      if (official === selectedPais && r.canal === selectedCanal) {
        map.set(r.categoria, (map.get(r.categoria) ?? 0) + r.total);
      }
    }
    return Array.from(map.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [canalRows, selectedPais, selectedCanal]);

  const subcategorias = useMemo(() => {
    if (!selectedPais || !selectedCanal || !selectedCategoria) return [];
    return subRows
      .filter((r) => normalizeCountry(r.pais) === selectedPais && r.canal === selectedCanal && r.categoria === selectedCategoria)
      .map((r) => ({ subcategoria: r.subcategoria, total: r.total }))
      .sort((a, b) => b.total - a.total);
  }, [subRows, selectedPais, selectedCanal, selectedCategoria]);

  if (rows.length === 0) return null;

  const subtitle = !selectedPais
    ? "Seleccione un país para comenzar."
    : !selectedCanal
      ? "Seleccione un canal."
      : !selectedCategoria
        ? "Categorías del canal."
        : "Desglose por subcategoría.";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35fr_65fr]">
      {/* LEFT PANEL */}
      <div className="rounded-2xl border border-black-10 bg-white ">
        <div className="border-b border-black-10 px-3 py-2">
          <h3 className="text-xs font-semibold text-black-85">País por Canal</h3>
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full table-auto">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="border-r border-black-10 px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">País</th>
                <th className="border-r border-black-10 px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-0 whitespace-nowrap">Vol</th>
                <th className="px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-0 whitespace-nowrap">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const isSelected = selectedPais === g.pais;
                return (
                  <tr
                    key={g.pais}
                    onClick={() => onSelectPais(isSelected ? null : g.pais)}
                    className={`cursor-pointer border-t border-black-5 transition-all duration-150 hover:bg-[#FFF7ED] ${
                      isSelected ? "bg-[#FFF7ED] border-l-2 border-l-[#F97316]" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className={`border-r border-black-5 px-1.5 py-1 text-[11px] font-medium truncate max-w-[140px] ${isSelected ? "text-primary" : "text-black-85"}`}>{g.pais}</td>
                    <td className="border-r border-black-5 px-1.5 py-1 text-[11px] text-right font-medium text-black-85 whitespace-nowrap">{g.volumen.toLocaleString("es-PE")}</td>
                    <td className="px-1.5 py-1 text-[11px] text-right text-[#475569] whitespace-nowrap">{g.pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="rounded-2xl border border-black-10 bg-white ">
        <div className="border-b border-black-10 px-4 py-3">
          <h3 className="text-xs font-semibold text-black-85">
            {selectedPais ? (
              <span>
                <button onClick={() => onSelectPais(selectedPais)} className="text-primary hover:underline cursor-pointer">{selectedPais}</button>
                {selectedCanal ? (
                  <>
                    <span className="text-black-25 font-normal"> &nbsp;›&nbsp; </span>
                    <button onClick={() => onSelectCanal(selectedCanal)} className="text-primary hover:underline cursor-pointer">{selectedCanal}</button>
                    {selectedCategoria ? (
                      <>
                        <span className="text-black-25 font-normal"> &nbsp;›&nbsp; </span>
                        <span className="text-primary">{selectedCategoria}</span>
                      </>
                    ) : null}
                  </>
                ) : null}
              </span>
            ) : (
              "Navegación"
            )}
          </h3>
          <p className="mt-0.5 text-[10px] text-black-25">{subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedPais ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-16 text-xs text-black-25">Seleccione un país para comenzar.</motion.div>
          ) : !selectedCanal ? (
            <motion.div key="canales" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="overflow-auto max-h-[440px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white"><tr><th className="border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Canal</th><th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-[1%]">Volumen</th></tr></thead>
                  <tbody>
                    {canales.map((c) => {
                      const isSelected = selectedCanal === c.nombre;
                      return (<tr key={c.nombre} onClick={() => onSelectCanal(isSelected ? null : c.nombre)}
                        className={`cursor-pointer border-t border-black-5 transition-all duration-150 hover:bg-[#FFF7ED] ${isSelected ? "bg-[#FFF7ED] border-l-2 border-l-[#F97316]" : "border-l-2 border-l-transparent"}`}>
                        <td className={`border-r border-black-5 px-2 py-1.5 text-[11px] ${isSelected ? "font-semibold text-primary" : "text-[#475569]"}`}>{c.nombre}</td>
                        <td className="px-2 py-1.5 text-[11px] text-right font-medium text-black-85">{c.total.toLocaleString("es-PE")}</td>
                      </tr>);
                    })}
                    {canales.length === 0 ? (<tr><td colSpan={2} className="px-2 py-8 text-center text-xs text-black-25">Sin canales para este país.</td></tr>) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : !selectedCategoria ? (
            <motion.div key="categorias" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="overflow-auto max-h-[440px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white"><tr><th className="border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Categoría</th><th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-[1%]">Volumen</th></tr></thead>
                  <tbody>
                    {categorias.map((cat) => {
                      const isSelected = selectedCategoria === cat.nombre;
                      return (<tr key={cat.nombre} onClick={() => onSelectCategoria(isSelected ? null : cat.nombre)}
                        className={`cursor-pointer border-t border-black-5 transition-all duration-150 hover:bg-[#FFF7ED] ${isSelected ? "bg-[#FFF7ED] border-l-2 border-l-[#F97316]" : "border-l-2 border-l-transparent"}`}>
                        <td className={`border-r border-black-5 px-2 py-1.5 text-[11px] ${isSelected ? "font-semibold text-primary" : "text-[#475569]"}`}>{cat.nombre}</td>
                        <td className="px-2 py-1.5 text-[11px] text-right font-medium text-black-85">{cat.total.toLocaleString("es-PE")}</td>
                      </tr>);
                    })}
                    {categorias.length === 0 ? (<tr><td colSpan={2} className="px-2 py-8 text-center text-xs text-black-25">Sin categorías para este canal.</td></tr>) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div key="subcategorias" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="overflow-auto max-h-[440px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white"><tr><th className="border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Subcategoría</th><th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-[1%]">Volumen</th></tr></thead>
                  <tbody>
                    {subcategorias.map((s) => (<tr key={s.subcategoria} className="border-t border-black-5 hover:bg-[#FFF7ED] transition-colors"><td className="border-r border-black-5 px-2 py-1.5 text-[11px] text-[#475569]"><span className="flex items-center gap-1"><ChevronRight size={10} className="text-primary shrink-0" />{s.subcategoria}</span></td><td className="px-2 py-1.5 text-[11px] text-right font-medium text-black-85">{s.total.toLocaleString("es-PE")}</td></tr>))}
                    {subcategorias.length === 0 ? (<tr><td colSpan={2} className="px-2 py-8 text-center text-xs text-black-25">Sin subcategorías.</td></tr>) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Pais() {
  const { filters, setFilters } = useFilters();
  const autoSet = useRef(false);
  const [selectedPais, setSelectedPais] = useState<string | null>(null);
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  useEffect(() => {
    if (autoSet.current) return;
    if (!filters.fechaHoraInicio && !filters.fechaHoraFin) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const mi = String(now.getMinutes()).padStart(2, "0");
      autoSet.current = true;
      setFilters({
        ...filters,
        fechaHoraInicio: `${y}-${m}-${d} 00:00`,
        fechaHoraFin: `${y}-${m}-${d} ${hh}:${mi}`,
      });
    }
  }, [filters, setFilters]);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) if (v) p[k] = v;
    return p;
  }, [filters]);

  /* Reset selections on filter change */
  useEffect(() => {
    setSelectedPais(null);
    setSelectedCanal(null);
    setSelectedCategoria(null);
  }, [params]);

  const { data, isLoading } = useQuery({
    queryKey: ["pais", params],
    queryFn: () => fetchPais(params),
    refetchOnWindowFocus: false,
  });

  interface EvolucionRow { periodo: string; pais: string; total: number; }
  const { data: evolucionData, isLoading: evolLoading } = useQuery({
    queryKey: ["pais-evolucion", params],
    queryFn: () => api.get("/dashboard/tendencias", { params }).then((r) => r.data.data.evolucionPais as EvolucionRow[]),
    refetchOnWindowFocus: false,
  });

  const MESES_ABR: Record<string, string> = {
    "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
  };

  const [granularity, setGranularity] = useState<"dia" | "semana" | "mes" | "anio">("dia");

  function weekKey(d: Date): string {
    const start = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
    return `${d.getFullYear()}-W${String(Math.floor(days / 7) + 1).padStart(2, "0")}`;
  }

  const GRANULARITY_LABELS: Record<typeof granularity, string> = {
    dia: "Dia", semana: "Semana", mes: "Mes", anio: "Año",
  };

  const evolucionChart = useMemo(() => {
    if (!evolucionData?.length) return null;
    const map = new Map<string, Map<string, number>>();
    for (const r of evolucionData) {
      const d = new Date(r.periodo);
      if (isNaN(d.getTime())) continue;
      const official = normalizeCountry(r.pais);
      if (!official) continue;
      let key: string;
      switch (granularity) {
        case "dia": key = r.periodo.slice(0, 10); break;
        case "semana": key = weekKey(d); break;
        case "mes": key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; break;
        case "anio": key = `${d.getFullYear()}`; break;
      }
      if (!map.has(key)) map.set(key, new Map());
      const mMap = map.get(key)!;
      mMap.set(official, (mMap.get(official) ?? 0) + r.total);
    }

    const allCountries = new Set<string>();
    for (const [, mMap] of map) for (const c of mMap.keys()) allCountries.add(c);
    if (allCountries.size === 0) return null;

    const sortedKeys = [...map.keys()].sort();
    const categories = sortedKeys.map((k) => {
      switch (granularity) {
        case "dia": return `${parseInt(k.slice(8), 10)} ${MESES_ABR[k.slice(5, 7)]}`;
        case "semana": return k.slice(5);
        case "mes": return MESES_ABR[k.slice(5)] ?? k;
        case "anio": return k;
      }
    });
    const series = [...allCountries].sort().map((country) => ({
      name: country,
      data: sortedKeys.map((k) => map.get(k)?.get(country) ?? 0),
    }));

    return { categories, series };
  }, [evolucionData, granularity]);

  const processed = useMemo(() => {
    if (!data) return null;
    const filas = processRows(data.filas);
    const totales = computeTotals(filas);
    return { filas, totales };
  }, [data]);

  const leftRows = useMemo(() => {
    if (!processed) return [];
    const { filas } = processed;
    const grandTotal = filas.reduce((s, r) => s + r.wpp_total + r.corr_total, 0);
    return filas
      .map((r) => ({
        pais: r.pais,
        volumen: r.wpp_total + r.corr_total,
        pct: grandTotal > 0 ? ((r.wpp_total + r.corr_total) / grandTotal * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.volumen - a.volumen);
  }, [processed]);

  const onSelectPais = useCallback((pais: string | null) => {
    setSelectedPais(pais);
    setSelectedCanal(null);
    setSelectedCategoria(null);
  }, []);

  const onSelectCanal = useCallback((canal: string | null) => {
    setSelectedCanal(canal);
    setSelectedCategoria(null);
  }, []);

  const onSelectCategoria = useCallback((categoria: string | null) => {
    setSelectedCategoria(categoria);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10">
          <Globe size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-black-85">País</h1>
          <p className="text-xs text-black-25">Matriz de indicadores por país</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black-10 border-t-[#F97316]" />
        </div>
      )}

      {processed && (
        <div className="space-y-8">
          <MetricsMatrix
            title="WHATSAPP"
            subtitle="Whaticket + Whatmeta"
            filas={processed.filas}
            totales={processed.totales}
            canal="wpp"
            getName={(r) => r.pais}
          />
          <MetricsMatrix
            title="CORREO"
            subtitle="Zendesk"
            filas={processed.filas}
            totales={processed.totales}
            canal="corr"
            getName={(r) => r.pais}
          />
          <div className="rounded-xl border border-black-10 bg-white ">
            <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
              <div>
                <h3 className="text-xs font-semibold text-black-85">Evolución de Atenciones por País</h3>
                {evolLoading && <p className="mt-0.5 text-[10px] text-black-10">Cargando…</p>}
              </div>
              <div className="flex gap-1">
                {(Object.keys(GRANULARITY_LABELS) as (keyof typeof GRANULARITY_LABELS)[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                      granularity === g ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10",
                    )}
                  >
                    {GRANULARITY_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              {!evolucionChart && !evolLoading ? (
                <div className="flex items-center justify-center py-16 text-xs text-black-25">Sin información para el período seleccionado.</div>
              ) : (
                <AreaChart
                  title=""
                  data={evolucionChart ?? { categories: [], series: [] }}
                  config={{ height: 260, showLegend: true, showTooltip: true, showGrid: true }}
                  state={{
                    isLoading: evolLoading,
                    isEmpty: !evolLoading && !evolucionChart,
                  }}
                />
              )}
            </div>
          </div>
          {data?.paisCanal ? (
            <PaisCanalTable
              rows={leftRows}
              canalRows={data.paisCanal}
              subRows={data.paisCanalSub}
              selectedPais={selectedPais}
              selectedCanal={selectedCanal}
              selectedCategoria={selectedCategoria}
              onSelectPais={onSelectPais}
              onSelectCanal={onSelectCanal}
              onSelectCategoria={onSelectCategoria}
            />
          ) : null}
        </div>
      )}
    </motion.div>
  );
}
