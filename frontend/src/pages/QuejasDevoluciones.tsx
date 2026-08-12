import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, MessageCircle, Globe, Users, Clock, Calendar, Building2 } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { getAdvisorColor } from "@/lib/advisorColors";

/* ─── Tipos ─── */
interface QDResponse {
  totalQuejas: number;
  totalDevoluciones: number;
  totalGeneral: number;
  totalClientesConNombre: number;
  evolucion: { periodo: string; quejas: number; devoluciones: number }[];
  porCanal: { canal: string; quejas: number; devoluciones: number }[];
  porPais: { pais: string; quejas: number; devoluciones: number }[];
  porAsesor: { asesor: string; quejas: number; devoluciones: number }[];
  porCliente: { cliente: string; quejas: number; devoluciones: number }[];
  porDia: { fecha: string; quejas: number; devoluciones: number }[];
  porDiaSemana: { dia: string; orden: number; quejas: number; devoluciones: number }[];
  porHora: { hora: number; quejas: number; devoluciones: number }[];
  tiempos: { tipo: string; primeraRespuestaPromedio: number | null; resolucionPromedio: number | null }[];
  variacion: {
    total: { actual: number; anterior: number; delta: number; pct: number | null };
    quejas: { actual: number; anterior: number; delta: number; pct: number | null };
    devoluciones: { actual: number; anterior: number; delta: number; pct: number | null };
  };
}

async function fetchQD(params: Record<string, string>): Promise<QDResponse> {
  const { data } = await api.get("/dashboard/quejas-devoluciones", { params });
  return data.data as QDResponse;
}

const fmtNum = (n: number | null) => n == null ? "—" : n.toLocaleString("es-PE");
const fmtPct = (n: number | null) => n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtDur = (min: number | null) => {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60; return `${Math.round(h)} h`;
};
const fmtPctPlain = (n: number) => `${n.toFixed(1)}%`;

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS_NEGOCIO = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];

function fmtPeriodo(p: string): string {
  if (p.includes("-") && p.length === 10) { const parts = p.split("-"); return `${parts[2]}/${parts[1]}`; }
  if (p.includes("-") && p.length === 7) { const m = parseInt(p.slice(5), 10); return MESES[m - 1] ?? p; }
  return p;
}

/* ─── KPI Card ─── */
function KpiCard({ label, valor, variacion, hint }: { label: string; valor: string; variacion?: { pct: number | null }; hint?: string }) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-black-45">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-black-85">{valor}</p>
      {variacion?.pct != null && (
        <p className={`mt-1 text-xs font-medium ${variacion.pct >= 0 ? "text-success" : "text-danger"}`}>
          {variacion.pct >= 0 ? "▲" : "▼"} {Math.abs(variacion.pct)}% vs anterior
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-black-25">{hint}</p>}
    </div>
  );
}

/* ─── Variation Table ─── */
function VariationTable({ v }: { v: QDResponse["variacion"] }) {
  const rows = [
    { label: "Total casos", data: v.total },
    { label: "Quejas", data: v.quejas },
    { label: "Devoluciones", data: v.devoluciones },
  ];
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5">
      <h3 className="text-sm font-medium text-black-85">Variacion vs periodo anterior</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-black-45">
            <th className="pb-1">Indicador</th><th className="text-right pb-1">Actual</th><th className="text-right pb-1">Anterior</th><th className="text-right pb-1">Delta</th><th className="text-right pb-1">%</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-black-5">
                <td className="py-1 text-black-85">{r.label}</td>
                <td className="text-right text-black-85">{fmtNum(r.data.actual)}</td>
                <td className="text-right text-black-45">{fmtNum(r.data.anterior)}</td>
                <td className={`text-right font-medium ${r.data.delta == null ? "text-black-45" : r.data.delta > 0 ? "text-success" : r.data.delta < 0 ? "text-danger" : "text-black-45"}`}>{fmtNum(r.data.delta)}</td>
                <td className={`text-right font-medium ${r.data.pct == null ? "text-black-45" : r.data.pct > 0 ? "text-success" : r.data.pct < 0 ? "text-danger" : "text-black-45"}`}>{fmtPct(r.data.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Advisor Dot ─── */
function AdvisorDot({ name }: { name: string }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: getAdvisorColor(name) }} />;
}

/* ─── Color constants ─── */
const COLOR_QUEJA = "#EA7A7A";
const COLOR_DEVOLUCION = "#7BA3C7";

/* ─── Page ─── */
export default function QuejasDevoluciones() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quejas-devoluciones", params],
    queryFn: () => fetchQD(params),
    refetchOnWindowFocus: false,
  });

  // Valores derivados seguros (data puede ser undefined durante loading)
  const totalQD = (data?.totalQuejas ?? 0) + (data?.totalDevoluciones ?? 0);
  const top5 = (data?.porCliente ?? []).filter((c) => c.cliente !== "Sin cliente").slice(0, 5);
  const top5Pct = totalQD > 0 ? (top5.reduce((s, c) => s + c.quejas + c.devoluciones, 0) / totalQD) * 100 : 0;
  const clientesConNombre = (data?.porCliente ?? []).filter((c) => c.cliente !== "Sin cliente");

  /* ── Evolucion ── */
  const evoOpt = useMemo(() => {
    const evolucion = data?.evolucion ?? [];
    return {
      tooltip: {
        trigger: "axis" as const,
        formatter: (ps: { seriesName: string; value: number; color: string; axisValueLabel: string }[]) => {
          const q = ps.find((p) => p.seriesName === "Quejas")?.value ?? 0;
          const d = ps.find((p) => p.seriesName === "Devoluciones")?.value ?? 0;
          return `${ps[0]?.axisValueLabel ?? ""}<br/><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLOR_QUEJA};margin-right:4px"></span>Quejas: <b>${q}</b><br/><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLOR_DEVOLUCION};margin-right:4px"></span>Devoluciones: <b>${d}</b><hr style="margin:4px 0;border-color:#E2E8F0"/>Total casos: <b>${q + d}</b>`;
        },
      },
      legend: { bottom: 0, textStyle: { color: "#64748B", fontSize: 11 } },
      grid: { left: 50, right: 20, top: 15, bottom: 50 },
      xAxis: { type: "category" as const, data: evolucion.map((r) => fmtPeriodo(r.periodo)), axisLabel: { color: "#64748B", fontSize: 10, rotate: evolucion.length > 20 ? 45 : 0 } },
      yAxis: { type: "value" as const, axisLabel: { color: "#64748B", fontSize: 10 }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } } },
      series: [
        { name: "Quejas", type: "line", data: evolucion.map((r) => r.quejas), smooth: true, lineStyle: { width: 2, color: COLOR_QUEJA }, itemStyle: { color: COLOR_QUEJA }, areaStyle: { color: "rgba(234,122,122,0.08)" } },
        { name: "Devoluciones", type: "line", data: evolucion.map((r) => r.devoluciones), smooth: true, lineStyle: { width: 2, color: COLOR_DEVOLUCION }, itemStyle: { color: COLOR_DEVOLUCION }, areaStyle: { color: "rgba(123,163,199,0.08)" } },
        { name: "Total casos", type: "line", data: evolucion.map((r) => r.quejas + r.devoluciones), smooth: true, lineStyle: { width: 2, color: "#64748B", type: "dashed" }, itemStyle: { color: "#64748B" } },
      ],
    };
  }, [data]);

  /* ── Canal ── */
  const canalOpt = useMemo(() => {
    const porCanal = data?.porCanal ?? [];
    return {
      tooltip: { trigger: "axis" as const },
      legend: { bottom: 0, textStyle: { color: "#64748B", fontSize: 11 } },
      grid: { left: 50, right: 20, top: 10, bottom: 40 },
      xAxis: { type: "category" as const, data: porCanal.map((r) => r.canal), axisLabel: { color: "#64748B", fontSize: 10 } },
      yAxis: { type: "value" as const, axisLabel: { color: "#64748B", fontSize: 10 }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } } },
      series: [
        { name: "Quejas", type: "bar", data: porCanal.map((r) => r.quejas), itemStyle: { color: COLOR_QUEJA, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 40 },
        { name: "Devoluciones", type: "bar", data: porCanal.map((r) => r.devoluciones), itemStyle: { color: COLOR_DEVOLUCION, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 40 },
      ],
    };
  }, [data]);

  /* ── Clientes bar chart ── */
  const clienteOpt = useMemo(() => {
    if (!clientesConNombre.length) return null;
    const top = clientesConNombre.slice(0, 10);
    return {
      tooltip: { trigger: "axis" as const },
      grid: { left: 120, right: 30, top: 10, bottom: 20 },
      xAxis: { type: "value" as const, axisLabel: { color: "#64748B", fontSize: 9 } },
      yAxis: { type: "category" as const, data: top.map((c) => c.cliente).reverse(), axisLabel: { color: "#1E293B", fontSize: 10 } },
      series: [
        { name: "Quejas", type: "bar", stack: "total", data: top.map((c) => c.quejas).reverse(), itemStyle: { color: COLOR_QUEJA }, barMaxWidth: 18 },
        { name: "Devoluciones", type: "bar", stack: "total", data: top.map((c) => c.devoluciones).reverse(), itemStyle: { color: COLOR_DEVOLUCION }, barMaxWidth: 18 },
      ],
    };
  }, [clientesConNombre]);

  /* ── Por dia chart ── */
  const porDiaOpt = useMemo(() => {
    const porDia = data?.porDia ?? [];
    return {
      tooltip: {
        trigger: "axis" as const,
        formatter: (ps: { seriesName: string; value: number; axisValueLabel: string }[]) => {
          const q = ps.find((p) => p.seriesName === "Quejas")?.value ?? 0;
          const d = ps.find((p) => p.seriesName === "Devoluciones")?.value ?? 0;
          return `${ps[0]?.axisValueLabel ?? ""}<br/>Quejas: <b>${q}</b><br/>Devoluciones: <b>${d}</b><br/>Total: <b>${q + d}</b>`;
        },
      },
      legend: { bottom: 0, textStyle: { color: "#64748B", fontSize: 11 } },
      grid: { left: 50, right: 20, top: 15, bottom: 50 },
      xAxis: { type: "category" as const, data: porDia.map((r) => r.fecha.slice(5)), axisLabel: { color: "#64748B", fontSize: 10, rotate: porDia.length > 20 ? 45 : 0 } },
      yAxis: { type: "value" as const, axisLabel: { color: "#64748B", fontSize: 10 }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } } },
      series: [
        { name: "Quejas", type: "line", data: porDia.map((r) => r.quejas), smooth: true, lineStyle: { width: 2, color: COLOR_QUEJA }, itemStyle: { color: COLOR_QUEJA }, areaStyle: { color: "rgba(234,122,122,0.08)" } },
        { name: "Devoluciones", type: "line", data: porDia.map((r) => r.devoluciones), smooth: true, lineStyle: { width: 2, color: COLOR_DEVOLUCION }, itemStyle: { color: COLOR_DEVOLUCION }, areaStyle: { color: "rgba(123,163,199,0.08)" } },
      ],
    };
  }, [data]);

  /* ── Dia semana chart ── */
  const diaSemanaOpt = useMemo(() => {
    const diaSemana = data?.porDiaSemana ?? [];
    const sorted = [...diaSemana].sort((a, b) => ((a.orden + 6) % 7) - ((b.orden + 6) % 7));
    return {
      tooltip: { trigger: "axis" as const },
      grid: { left: 50, right: 20, top: 10, bottom: 30 },
      xAxis: { type: "category" as const, data: sorted.map((r) => DIAS_NEGOCIO[((r.orden + 6) % 7)]), axisLabel: { color: "#64748B", fontSize: 10, rotate: 30 } },
      yAxis: { type: "value" as const, axisLabel: { color: "#64748B", fontSize: 10 }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } } },
      series: [
        { name: "Quejas", type: "bar", data: sorted.map((r) => r.quejas), itemStyle: { color: COLOR_QUEJA, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 20 },
        { name: "Devoluciones", type: "bar", data: sorted.map((r) => r.devoluciones), itemStyle: { color: COLOR_DEVOLUCION, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 20 },
      ],
    };
  }, [data]);

  /* ── Hora chart ── */
  const horaOpt = useMemo(() => {
    const porHora = data?.porHora ?? [];
    return {
      tooltip: { trigger: "axis" as const },
      grid: { left: 50, right: 20, top: 10, bottom: 30 },
      xAxis: { type: "category" as const, data: porHora.map((r) => `${r.hora}:00`), axisLabel: { color: "#64748B", fontSize: 9, rotate: porHora.length > 12 ? 45 : 0 } },
      yAxis: { type: "value" as const, axisLabel: { color: "#64748B", fontSize: 10 }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } } },
      series: [
        { name: "Quejas", type: "bar", data: porHora.map((r) => r.quejas), itemStyle: { color: COLOR_QUEJA, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 16 },
        { name: "Devoluciones", type: "bar", data: porHora.map((r) => r.devoluciones), itemStyle: { color: COLOR_DEVOLUCION, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 16 },
      ],
    };
  }, [data]);

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black-5 animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 w-48 rounded bg-black-5 animate-pulse" />
            <div className="h-3 w-64 rounded bg-black-5 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="rounded-xl border border-black-10 bg-white p-5 animate-pulse"><div className="h-3 w-20 rounded bg-black-5 mb-3" /><div className="h-8 w-16 rounded bg-black-5" /></div>)}
        </div>
        <div className="rounded-xl border border-black-10 bg-white p-5 animate-pulse"><div className="h-4 w-40 rounded bg-black-5 mb-3" /><div className="h-[280px] rounded bg-black-5" /></div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-5 mb-4">
          <AlertTriangle size={28} className="text-danger" />
        </div>
        <p className="text-sm font-medium text-black-85">No fue posible cargar los datos del reporte.</p>
        <p className="mt-1 text-xs text-black-45">Verifique la conexion e intente nuevamente.</p>
        <button onClick={() => refetch()} className="mt-4 rounded bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-85">Reintentar</button>
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-5">
          <AlertTriangle size={18} className="text-purple" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-black-85">Quejas y Devoluciones</h1>
          <p className="text-xs text-black-25">Analisis de quejas y devoluciones del periodo.</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <KpiCard label="Total casos" valor={fmtNum(totalQD)} variacion={data.variacion.total} />
          <KpiCard label="Quejas" valor={fmtNum(data.totalQuejas)} variacion={data.variacion.quejas} />
          <KpiCard label="Devoluciones" valor={fmtNum(data.totalDevoluciones)} variacion={data.variacion.devoluciones} />
          <KpiCard label="% Quejas" valor={totalQD > 0 ? fmtPctPlain((data.totalQuejas / totalQD) * 100) : "—"} hint="Participacion de quejas" />
          <KpiCard label="Total atenciones" valor={fmtNum(data.totalGeneral)} hint="Todas las atenciones del periodo" />
        </div>

        {/* ── Tendencia ── */}
        <div className="rounded-xl border border-black-10 bg-white p-5">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Evolucion en el tiempo</h3></div>
          <p className="text-xs text-black-25 mb-2">Quejas, devoluciones y total de casos por periodo.</p>
          <ReactECharts option={evoOpt} style={{ height: 280 }} notMerge lazyUpdate />
        </div>

        {/* ── Donut Queja vs Devolucion ── */}
        <div className="rounded-xl border border-black-10 bg-white p-5">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Distribucion Queja vs Devolucion</h3></div>
          <p className="text-xs text-black-25 mb-2">{totalQD} casos totales. {fmtPctPlain((data.totalQuejas / totalQD) * 100)} quejas, {fmtPctPlain((data.totalDevoluciones / totalQD) * 100)} devoluciones.</p>
          <ReactECharts
            option={{
              tooltip: { trigger: "item" as const, formatter: (p: { name: string; value: number; percent: number }) => `${p.name}: ${p.value} (${p.percent}%)` },
              legend: { bottom: 0, textStyle: { color: "#64748B", fontSize: 11 } },
              series: [{
                type: "pie" as const, radius: ["55%", "72%"], center: ["50%", "48%"],
                itemStyle: { borderColor: "#fff", borderWidth: 2 },
                label: { show: true, formatter: (p: { percent: number }) => `${p.percent}%`, color: "#1E293B", fontWeight: 600 as const, fontSize: 11 },
                data: [
                  { name: "Quejas", value: data.totalQuejas, itemStyle: { color: COLOR_QUEJA } },
                  { name: "Devoluciones", value: data.totalDevoluciones, itemStyle: { color: COLOR_DEVOLUCION } },
                ],
              }],
              graphic: { type: "text" as const, left: "center", top: "44%", style: { text: `${totalQD}`, fill: "#1E293B", fontSize: 16, fontWeight: 700 as const, textAlign: "center" as const } },
            }}
            style={{ height: 240 }}
            notMerge lazyUpdate
          />
        </div>

        {/* ── Variacion ── */}
        <VariationTable v={data.variacion} />

        {/* ── Clientes ── */}
        <div className="rounded-xl border border-black-10 bg-white p-5">
          <div className="flex items-center gap-2 mb-1"><Building2 size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Clientes con mayor cantidad de casos</h3></div>
          <p className="text-xs text-black-25 mb-2">{data.totalClientesConNombre} clientes identificados de {data.porCliente.length} registros. Top 5 concentran {fmtPctPlain(top5Pct)}.</p>
          {clienteOpt ? <ReactECharts option={clienteOpt} style={{ height: Math.max(180, clientesConNombre.slice(0, 10).length * 28) }} notMerge lazyUpdate /> : <p className="text-xs text-black-25">Sin datos de cliente identificado.</p>}
          <div className="mt-3 max-h-[300px] overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-black-45"><th className="pb-1">Cliente</th><th className="text-right pb-1">Quejas</th><th className="text-right pb-1">Devol.</th><th className="text-right pb-1">Total</th><th className="text-right pb-1">%</th></tr></thead>
              <tbody>
                {data.porCliente.map((r) => {
                  const t = r.quejas + r.devoluciones;
                  return (
                    <tr key={r.cliente} className="border-t border-black-5">
                      <td className="py-1 text-black-85 text-[11px]">{r.cliente}</td>
                      <td className="text-right text-black-85">{fmtNum(r.quejas)}</td>
                      <td className="text-right text-black-85">{fmtNum(r.devoluciones)}</td>
                      <td className="text-right font-medium text-black-85">{fmtNum(t)}</td>
                      <td className="text-right text-black-45">{totalQD > 0 ? fmtPctPlain((t / totalQD) * 100) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Canal + Pais ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-black-10 bg-white p-5">
            <div className="flex items-center gap-2 mb-1"><MessageCircle size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Por canal</h3></div>
            <ReactECharts option={canalOpt} style={{ height: 240 }} notMerge lazyUpdate />
          </div>
          <div className="rounded-xl border border-black-10 bg-white p-5">
            <div className="flex items-center gap-2 mb-1"><Globe size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Por pais</h3></div>
            <div className="mt-2 max-h-[240px] overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-black-45"><th className="pb-1">Pais</th><th className="text-right pb-1">Quejas</th><th className="text-right pb-1">Devol.</th><th className="text-right pb-1">Total</th><th className="text-right pb-1">%</th></tr></thead>
                <tbody>
                  {data.porPais.sort((a, b) => (b.quejas + b.devoluciones) - (a.quejas + a.devoluciones)).map((r) => {
                    const t = r.quejas + r.devoluciones;
                    return (
                      <tr key={r.pais} className="border-t border-black-5">
                        <td className="py-1 text-black-85">{r.pais}</td>
                        <td className="text-right text-black-85">{fmtNum(r.quejas)}</td>
                        <td className="text-right text-black-85">{fmtNum(r.devoluciones)}</td>
                        <td className="text-right font-medium text-black-85">{fmtNum(t)}</td>
                        <td className="text-right text-black-45">{totalQD > 0 ? fmtPctPlain((t / totalQD) * 100) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Asesores ── */}
        <div className="rounded-xl border border-black-10 bg-white p-5">
          <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Por asesor</h3></div>
          <div className="mt-2 max-h-[300px] overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-black-45"><th className="pb-1">Asesor</th><th className="text-right pb-1">Quejas</th><th className="text-right pb-1">Devol.</th><th className="text-right pb-1">Total</th><th className="text-right pb-1">%</th></tr></thead>
              <tbody>
                {data.porAsesor.sort((a, b) => (b.quejas + b.devoluciones) - (a.quejas + a.devoluciones)).map((r) => {
                  const t = r.quejas + r.devoluciones;
                  return (
                    <tr key={r.asesor} className="border-t border-black-5">
                      <td className="py-1 text-black-85"><span className="inline-flex items-center"><AdvisorDot name={r.asesor} />{r.asesor}</span></td>
                      <td className="text-right text-black-85">{fmtNum(r.quejas)}</td>
                      <td className="text-right text-black-85">{fmtNum(r.devoluciones)}</td>
                      <td className="text-right font-medium text-black-85">{fmtNum(t)}</td>
                      <td className="text-right text-black-45">{totalQD > 0 ? fmtPctPlain((t / totalQD) * 100) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Dia + Dia Semana ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-black-10 bg-white p-5">
            <div className="flex items-center gap-2 mb-1"><Calendar size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Por dia de semana</h3></div>
            <ReactECharts option={diaSemanaOpt} style={{ height: 220 }} notMerge lazyUpdate />
          </div>
          <div className="rounded-xl border border-black-10 bg-white p-5">
            <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Por hora</h3></div>
            <ReactECharts option={horaOpt} style={{ height: 220 }} notMerge lazyUpdate />
          </div>
        </div>

        {/* ── Por dia ── */}
        <div className="rounded-xl border border-black-10 bg-white p-5">
          <div className="flex items-center gap-2 mb-1"><Calendar size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Casos por dia</h3></div>
          <p className="text-xs text-black-25 mb-2">Evolucion diaria de quejas y devoluciones.</p>
          <ReactECharts option={porDiaOpt} style={{ height: 280 }} notMerge lazyUpdate />
        </div>

        {/* ── Tiempos ── */}
        <div className="rounded-xl border border-black-10 bg-white p-5">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-black-45" /><h3 className="text-sm font-medium text-black-85">Tiempos de atencion</h3></div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.tiempos.map((t) => (
              <div key={t.tipo} className="rounded-lg border border-black-5 p-4">
                <p className="text-xs text-black-45 uppercase tracking-wide">{t.tipo === "QUEJA" ? "Quejas" : "Devoluciones"}</p>
                <div className="mt-2 flex gap-4">
                  <div><p className="text-[10px] text-black-25">1ª respuesta</p><p className="text-lg font-semibold text-black-85">{fmtDur(t.primeraRespuestaPromedio)}</p></div>
                  <div><p className="text-[10px] text-black-25">Resolucion</p><p className="text-lg font-semibold text-black-85">{fmtDur(t.resolucionPromedio)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Insights ── */}
        {(() => {
          const items: string[] = [];
          if (totalQD > 0) items.push(`Las quejas representan el ${fmtPctPlain((data.totalQuejas / totalQD) * 100)} de los casos (${data.totalQuejas} de ${totalQD}).`);
          const topAsesor = [...data.porAsesor].sort((a, b) => (b.quejas + b.devoluciones) - (a.quejas + a.devoluciones))[0];
          if (topAsesor) items.push(`${topAsesor.asesor} atiende el mayor volumen con ${topAsesor.quejas + topAsesor.devoluciones} casos.`);
          const topCanal = [...data.porCanal].sort((a, b) => (b.quejas + b.devoluciones) - (a.quejas + a.devoluciones))[0];
          if (topCanal) items.push(`${topCanal.canal} concentra el mayor volumen con ${topCanal.quejas + topCanal.devoluciones} casos.`);
          const variacionTotal = data.variacion.total;
          if (variacionTotal.pct != null) {
            items.push(`La variacion vs periodo anterior es de ${variacionTotal.pct > 0 ? "+" : ""}${variacionTotal.pct}%.`);
          }
          if (data.totalClientesConNombre > 0) {
            items.push(`${data.totalClientesConNombre} clientes identificados de ${data.porCliente.length} registros con cliente.`);
          }
          return items.length > 0 ? (
            <div className="rounded-xl border border-black-10 bg-white p-5">
              <h3 className="text-sm font-medium text-black-85 mb-2">Principales hallazgos</h3>
              <ul className="space-y-1">
                {items.map((insight, i) => (
                  <li key={i} className="text-xs text-black-65 flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}
      </div>
    </motion.div>
  );
}
