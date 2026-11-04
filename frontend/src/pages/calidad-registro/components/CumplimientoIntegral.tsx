import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { Section } from "@/components/dashboard/shared";
import { C, escenarioPct, fmtNum, fmtPct } from "../format";
import type { CalidadRegistroResponse } from "../types";

export function CumplimientoIntegral({ data }: { data: CalidadRegistroResponse }) {
  const actual = data.resumen.actual;
  const periodos = data.evolucion;

  const evolucionOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, type: "scroll", textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 20, top: 20, bottom: 70 },
    xAxis: {
      type: "category",
      data: periodos.map((p) => p.periodo),
      axisLabel: { fontSize: 10, rotate: periodos.length > 14 ? 40 : 0 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { formatter: "{value}%", fontSize: 10 },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: [
      {
        name: "Cumple ambas",
        type: "bar",
        stack: "total",
        barMaxWidth: 42,
        itemStyle: { color: C.verde },
        data: periodos.map((p) => escenarioPct(p.integral.cumpleAmbas, p.total)),
      },
      {
        name: "Solo categoría homologada",
        type: "bar",
        stack: "total",
        barMaxWidth: 42,
        itemStyle: { color: C.ambar },
        data: periodos.map((p) => escenarioPct(p.integral.soloCategoriaHomologada, p.total)),
      },
      {
        name: "Solo dominio válido",
        type: "bar",
        stack: "total",
        barMaxWidth: 42,
        itemStyle: { color: C.azul },
        data: periodos.map((p) => escenarioPct(p.integral.soloDominioValido, p.total)),
      },
      {
        name: "Ninguna condición",
        type: "bar",
        stack: "total",
        barMaxWidth: 42,
        itemStyle: { color: C.rojo },
        data: periodos.map((p) => escenarioPct(p.integral.ningunaCondicion, p.total)),
      },
    ],
  };

  const donutOption: EChartsOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { formatter: "{d}%", fontSize: 11 },
        data: [
          { name: "Cumple ambas", value: actual.integral.cumpleAmbas, itemStyle: { color: C.verde } },
          {
            name: "Solo categoría homologada",
            value: actual.integral.soloCategoriaHomologada,
            itemStyle: { color: C.ambar },
          },
          {
            name: "Solo dominio válido",
            value: actual.integral.soloDominioValido,
            itemStyle: { color: C.azul },
          },
          {
            name: "Ninguna condición",
            value: actual.integral.ningunaCondicion,
            itemStyle: { color: C.rojo },
          },
        ],
      },
    ],
  };

  if (!periodos.length) {
    return (
      <Section title="Cumplimiento integral">
        <p className="py-8 text-center text-sm text-black-25">
          No hay atenciones para el rango seleccionado.
        </p>
      </Section>
    );
  }

  return (
    <Section
      title="Cumplimiento integral"
      subtitle="Cumple ambas = categoría homologada + dominio válido. Los cuatro escenarios son mutuamente excluyentes."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-black-85">Evolución de escenarios</h4>
          <ReactECharts option={evolucionOption} style={{ height: 320 }} notMerge lazyUpdate />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-black-85">Distribución del rango</h4>
          {actual.total > 0 ? (
            <ReactECharts option={donutOption} style={{ height: 320 }} notMerge lazyUpdate />
          ) : (
            <p className="py-16 text-center text-sm text-black-25">Sin atenciones.</p>
          )}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-black-45 sm:grid-cols-2 lg:grid-cols-4">
        <p>
          Cumple ambas:{" "}
          <b className="text-black-85">
            {fmtNum(actual.integral.cumpleAmbas)} ({fmtPct(actual.integral.pctCumplimientoIntegral)})
          </b>
        </p>
        <p>
          Solo categoría homologada:{" "}
          <b className="text-black-85">{fmtNum(actual.integral.soloCategoriaHomologada)}</b>
        </p>
        <p>
          Solo dominio válido:{" "}
          <b className="text-black-85">{fmtNum(actual.integral.soloDominioValido)}</b>
        </p>
        <p>
          Ninguna condición:{" "}
          <b className="text-black-85">{fmtNum(actual.integral.ningunaCondicion)}</b>
        </p>
      </div>
    </Section>
  );
}
