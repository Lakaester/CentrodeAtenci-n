import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { Section } from "@/components/dashboard/shared";
import { C, escenarioPct, fmtNum, fmtPct, fmtPpAbs } from "../format";
import type { CalidadCanal, CalidadRegistroResponse } from "../types";

function mejor<T>(items: T[], value: (t: T) => number | null): T | null {
  let best: T | null = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const v = value(item);
    if (v != null && v > bestValue) {
      bestValue = v;
      best = item;
    }
  }
  return best;
}

function maxCount<T>(items: T[], value: (t: T) => number): T | null {
  let best: T | null = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const v = value(item);
    if (v > bestValue) {
      bestValue = v;
      best = item;
    }
  }
  return best;
}

function Insight({
  titulo,
  valor,
  detalle,
  color,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-black-10 bg-light/60 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-black-45">{titulo}</p>
      <p className="mt-1 text-lg font-bold" style={{ color: color ?? "#111827" }}>
        {valor}
      </p>
      <p className="mt-0.5 text-xs text-black-45">{detalle}</p>
    </div>
  );
}

export function ComparativoCanal({ data }: { data: CalidadRegistroResponse }) {
  const canales = data.comparativo;
  const conDatos = canales.filter((c) => c.total > 0);

  const mejorIntegral = mejor(conDatos, (c) => c.integral.pctCumplimientoIntegral);
  const mayorBrechaHom = mejor(conDatos, (c) => c.categorizacion.brechaHomologacionPp);
  const mayorBrechaDom = mejor(conDatos, (c) => c.dominio.brechaDominioPp);
  const mayorNinguna = maxCount(conDatos, (c) => c.integral.ningunaCondicion);
  const mayorMejora = mejor(
    data.evolucionPorCanal
      .map((serie) => {
        const validos = serie.periodos.filter(
          (p) => p.total > 0 && p.integral.pctCumplimientoIntegral != null,
        );
        if (validos.length < 2) return null;
        const ultimo = validos[validos.length - 1];
        const anterior = validos[validos.length - 2];
        const delta =
          (ultimo.integral.pctCumplimientoIntegral ?? 0) -
          (anterior.integral.pctCumplimientoIntegral ?? 0);
        return {
          canal: serie.canal,
          canalLabel: serie.canalLabel,
          delta: Math.round(delta * 10) / 10,
          periodo: ultimo.periodo,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null),
    (x) => x.delta,
  );

  const gapOption = (
    titulo: string,
    serieA: string,
    serieB: string,
    valorA: (c: CalidadCanal) => number | null,
    valorB: (c: CalidadCanal) => number | null,
    colorA: string,
    colorB: string,
  ): EChartsOption => ({
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 20, top: 20, bottom: 55 },
    xAxis: {
      type: "category",
      data: canales.map((c) => c.canalLabel),
      axisLabel: { fontSize: 11 },
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
        name: serieA,
        type: "bar",
        barMaxWidth: 34,
        itemStyle: { color: colorA },
        label: { show: true, position: "top", formatter: "{c}%", fontSize: 10 },
        data: canales.map(valorA),
      },
      {
        name: serieB,
        type: "bar",
        barMaxWidth: 34,
        itemStyle: { color: colorB },
        label: { show: true, position: "top", formatter: "{c}%", fontSize: 10 },
        data: canales.map(valorB),
      },
    ],
    graphic: [
      {
        type: "text",
        left: 8,
        top: 0,
        style: { text: titulo, fontSize: 12, fontWeight: "bold", fill: "#374151" },
      },
    ],
  });

  const escenariosOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, type: "scroll", textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 20, top: 20, bottom: 70 },
    xAxis: {
      type: "category",
      data: canales.map((c) => c.canalLabel),
      axisLabel: { fontSize: 11 },
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
        barMaxWidth: 55,
        itemStyle: { color: C.verde },
        data: canales.map((c) => escenarioPct(c.integral.cumpleAmbas, c.total)),
      },
      {
        name: "Solo categoría homologada",
        type: "bar",
        stack: "total",
        barMaxWidth: 55,
        itemStyle: { color: C.ambar },
        data: canales.map((c) => escenarioPct(c.integral.soloCategoriaHomologada, c.total)),
      },
      {
        name: "Solo dominio válido",
        type: "bar",
        stack: "total",
        barMaxWidth: 55,
        itemStyle: { color: C.azul },
        data: canales.map((c) => escenarioPct(c.integral.soloDominioValido, c.total)),
      },
      {
        name: "Ninguna condición",
        type: "bar",
        stack: "total",
        barMaxWidth: 55,
        itemStyle: { color: C.rojo },
        data: canales.map((c) => escenarioPct(c.integral.ningunaCondicion, c.total)),
      },
    ],
  };

  if (!canales.length) {
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
      subtitle={
        canales.length < 2
          ? "Selecciona 2 o más canales para comparar. Se muestra el canal filtrado."
          : "Brechas entre indicador informado/registrado y el indicador validado/homologado."
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <ReactECharts
            option={gapOption(
              "Categorización: registrada vs homologada",
              "% Cat. registrada",
              "% Cat. homologada",
              (c) => c.categorizacion.pctRegistrada,
              (c) => c.categorizacion.pctHomologada,
              C.azul,
              C.verdeOscuro,
            )}
            style={{ height: 300 }}
            notMerge
            lazyUpdate
          />
        </div>
        <div>
          <ReactECharts
            option={gapOption(
              "Dominio: informado vs válido",
              "% Dom. informado",
              "% Dom. válido",
              (c) => c.dominio.pctInformado,
              (c) => c.dominio.pctValido,
              C.naranja,
              C.azul,
            )}
            style={{ height: 300 }}
            notMerge
            lazyUpdate
          />
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-black-85">
          Distribución de los cuatro escenarios
        </h4>
        <ReactECharts option={escenariosOption} style={{ height: 300 }} notMerge lazyUpdate />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Insight
          titulo="Mayor cumplimiento integral"
          valor={mejorIntegral ? mejorIntegral.canalLabel : "—"}
          detalle={
            mejorIntegral
              ? `${fmtPct(mejorIntegral.integral.pctCumplimientoIntegral)} · ${fmtNum(
                  mejorIntegral.integral.cumpleAmbas,
                )} atenciones`
              : "Sin datos"
          }
          color="#047857"
        />
        <Insight
          titulo="Mayor brecha de homologación"
          valor={mayorBrechaHom ? mayorBrechaHom.canalLabel : "—"}
          detalle={
            mayorBrechaHom
              ? `${fmtPpAbs(mayorBrechaHom.categorizacion.brechaHomologacionPp)} · ${fmtNum(
                  mayorBrechaHom.categorizacion.brechaHomologacionCount,
                )} registradas no homologadas`
              : "Sin datos"
          }
          color="#b45309"
        />
        <Insight
          titulo="Mayor brecha de dominio"
          valor={mayorBrechaDom ? mayorBrechaDom.canalLabel : "—"}
          detalle={
            mayorBrechaDom
              ? `${fmtPpAbs(mayorBrechaDom.dominio.brechaDominioPp)} · ${fmtNum(
                  mayorBrechaDom.dominio.brechaDominioCount,
                )} informados no válidos`
              : "Sin datos"
          }
          color="#b45309"
        />
        <Insight
          titulo="Más atenciones en 'ninguna'"
          valor={mayorNinguna ? mayorNinguna.canalLabel : "—"}
          detalle={
            mayorNinguna
              ? `${fmtNum(mayorNinguna.integral.ningunaCondicion)} atenciones · ${fmtPct(
                  mayorNinguna.total > 0
                    ? (mayorNinguna.integral.ningunaCondicion / mayorNinguna.total) * 100
                    : null,
                )}`
              : "Sin datos"
          }
          color="#b91c1c"
        />
        <Insight
          titulo="Mayor mejora integral (último periodo)"
          valor={mayorMejora ? mayorMejora.canalLabel : "—"}
          detalle={
            mayorMejora
              ? `${mayorMejora.delta > 0 ? "+" : ""}${mayorMejora.delta.toFixed(1)} pp · ${mayorMejora.periodo}`
              : "Sin dos periodos comparables"
          }
          color="#1d4ed8"
        />
      </div>
    </Section>
  );
}
