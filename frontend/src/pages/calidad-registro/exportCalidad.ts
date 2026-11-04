import * as XLSX from "xlsx";
import type { CalidadFila, CalidadMeta, CalidadRegistroResponse } from "./types";

function nombreArchivo(): string {
  return `Calidad_Registro_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

function anchos(rows: Record<string, unknown>[], min = 12): XLSX.ColInfo[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((k) => ({
    wch: Math.max(min, k.length + 2),
  }));
}

function agregarHoja(
  wb: XLSX.WorkBook,
  nombre: string,
  rows: Record<string, unknown>[],
): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = anchos(rows);
  XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
}

function filaTabla(f: CalidadFila): Record<string, unknown> {
  return {
    Periodo: f.periodo,
    "Inicio periodo": f.periodoInicio,
    "Fin periodo": f.periodoFin,
    Canal: f.canalLabel,
    Total: f.total,
    "Cat. registradas": f.categorizacion.registradas,
    "% Cat. registrada": f.categorizacion.pctRegistrada,
    "Cat. homologadas": f.categorizacion.homologadas,
    "% Cat. homologada": f.categorizacion.pctHomologada,
    "Brecha homologación (pp)": f.categorizacion.brechaHomologacionPp,
    "Registradas no homologadas": f.categorizacion.registradasNoHomologadas,
    "No registradas": f.categorizacion.noRegistradas,
    "Dom. informados": f.dominio.informados,
    "% Dom. informado": f.dominio.pctInformado,
    "Dom. válidos": f.dominio.validos,
    "% Dom. válido": f.dominio.pctValido,
    "Brecha dominio (pp)": f.dominio.brechaDominioPp,
    "Informados no válidos": f.dominio.informadosNoValidos,
    "No informados": f.dominio.noInformados,
    "Cumple ambas": f.integral.cumpleAmbas,
    "Solo categoría homologada": f.integral.soloCategoriaHomologada,
    "Solo dominio válido": f.integral.soloDominioValido,
    "Ninguna condición": f.integral.ningunaCondicion,
    "% Cumplimiento integral": f.integral.pctCumplimientoIntegral,
    "Var. cat. registrada (pp)": f.variacion.catRegistradaPp,
    "Var. cat. homologada (pp)": f.variacion.catHomologadaPp,
    "Var. dom. informado (pp)": f.variacion.domInformadoPp,
    "Var. dom. válido (pp)": f.variacion.domValidoPp,
    "Var. integral (pp)": f.variacion.integralPp,
  };
}

function filaResumenEjecutivo(data: CalidadRegistroResponse): Record<string, unknown>[] {
  const a = data.resumen.actual;
  const p = data.resumen.anterior;
  const v = data.resumen.variacion;
  const fila = (
    indicador: string,
    actual: number | null,
    anterior: number | null,
    varPp: number | null,
    varPct: number | null,
  ) => ({
    Indicador: indicador,
    Actual: actual,
    Anterior: anterior,
    "Variación pp": varPp,
    "Variación %": varPct,
  });

  return [
    fila("Total analizado", a.total, p?.total ?? null, null, v.totalPct),
    fila(
      "Atenciones categorizadas",
      a.categorizacion.registradas,
      p?.categorizacion.registradas ?? null,
      null,
      null,
    ),
    fila(
      "% Categorización",
      a.categorizacion.pctRegistrada,
      p?.categorizacion.pctRegistrada ?? null,
      v.catRegistradaPp,
      v.catRegistradaRel,
    ),
    fila(
      "Pendientes de categorizar",
      a.categorizacion.noRegistradas,
      p?.categorizacion.noRegistradas ?? null,
      null,
      null,
    ),
    fila(
      "Atenciones con dominio vinculado",
      a.dominio.informados,
      p?.dominio.informados ?? null,
      null,
      null,
    ),
    fila(
      "% Vinculación de dominio",
      a.dominio.pctInformado,
      p?.dominio.pctInformado ?? null,
      v.domInformadoPp,
      v.domInformadoRel,
    ),
    fila(
      "Pendientes de vincular dominio",
      a.dominio.noInformados,
      p?.dominio.noInformados ?? null,
      null,
      null,
    ),
  ];
}

function filaEvolucionEjecutiva(data: CalidadRegistroResponse): Record<string, unknown>[] {
  return data.evolucion.map((p) => ({
    Periodo: p.periodo,
    "Inicio periodo": p.periodoInicio,
    "Fin periodo": p.periodoFin,
    Total: p.total,
    Categorizadas: p.categorizacion.registradas,
    "Pendientes categorizar": p.categorizacion.noRegistradas,
    "% Categorización": p.categorizacion.pctRegistrada,
    "Con dominio": p.dominio.informados,
    "Sin dominio": p.dominio.noInformados,
    "% Vinculación": p.dominio.pctInformado,
  }));
}

function filaComparativo(data: CalidadRegistroResponse): Record<string, unknown>[] {
  return data.comparativo.map((c) => ({
    Canal: c.canalLabel,
    "Total atenciones": c.total,
    "% Categorizadas": c.categorizacion.pctRegistrada,
    "Pend. categorizar": c.categorizacion.noRegistradas,
    "% Con dominio": c.dominio.pctInformado,
    "Pend. dominio": c.dominio.noInformados,
  }));
}

/** Hoja técnica: conserva los indicadores de auditoría que no están en el resumen. */
function filaDiagnostico(data: CalidadRegistroResponse): Record<string, unknown>[] {
  const a = data.resumen.actual;
  const p = data.resumen.anterior;
  const v = data.resumen.variacion;
  const fila = (
    indicador: string,
    actual: number | null,
    anterior: number | null,
    variacion: number | null,
  ) => ({ Indicador: indicador, Actual: actual, Anterior: anterior, Variación: variacion });

  return [
    fila(
      "% Categorización homologada",
      a.categorizacion.pctHomologada,
      p?.categorizacion.pctHomologada ?? null,
      v.catHomologadaPp,
    ),
    fila(
      "Brecha de homologación (pp)",
      a.categorizacion.brechaHomologacionPp,
      p?.categorizacion.brechaHomologacionPp ?? null,
      null,
    ),
    fila(
      "% Dominio válido",
      a.dominio.pctValido,
      p?.dominio.pctValido ?? null,
      v.domValidoPp,
    ),
    fila(
      "Brecha de dominio (pp)",
      a.dominio.brechaDominioPp,
      p?.dominio.brechaDominioPp ?? null,
      null,
    ),
    fila(
      "% Cumplimiento integral",
      a.integral.pctCumplimientoIntegral,
      p?.integral.pctCumplimientoIntegral ?? null,
      v.integralPp,
    ),
    fila("Cumple ambas", a.integral.cumpleAmbas, p?.integral.cumpleAmbas ?? null, null),
    fila(
      "Solo categoría homologada",
      a.integral.soloCategoriaHomologada,
      p?.integral.soloCategoriaHomologada ?? null,
      null,
    ),
    fila(
      "Solo dominio válido",
      a.integral.soloDominioValido,
      p?.integral.soloDominioValido ?? null,
      null,
    ),
    fila("Ninguna condición", a.integral.ningunaCondicion, p?.integral.ningunaCondicion ?? null, null),
    fila(
      "Categorías registradas no homologadas",
      a.categorizacion.registradasNoHomologadas,
      p?.categorizacion.registradasNoHomologadas ?? null,
      null,
    ),
    fila(
      "Dominios informados no válidos",
      a.dominio.informadosNoValidos,
      p?.dominio.informadosNoValidos ?? null,
      null,
    ),
  ];
}

function filaFiltros(meta: CalidadMeta): Record<string, unknown>[] {
  return [
    { Filtro: "Fecha inicio", Valor: meta.inicio },
    { Filtro: "Fecha fin", Valor: meta.fin },
    { Filtro: "Canales", Valor: meta.canales },
    { Filtro: "Periodicidad", Valor: meta.granularidad },
    { Filtro: "Generado en", Valor: meta.generadoEn },
    {
      Filtro: "Resumen ejecutivo",
      Valor: "Categoría registrada y dominio informado.",
    },
    {
      Filtro: "Regla categoría registrada",
      Valor: "Texto de origen válido; excluye vacíos y marcadores 'sin categorizar'.",
    },
    {
      Filtro: "Regla dominio informado",
      Valor: "Dominio no vacío.",
    },
    {
      Filtro: "Diagnóstico técnico",
      Valor: "Categoría homologada, dominio válido, brechas y escenarios.",
    },
  ];
}

export function exportarCalidadCompleta(
  data: CalidadRegistroResponse,
  meta: CalidadMeta,
): void {
  const wb = XLSX.utils.book_new();

  agregarHoja(wb, "Resumen ejecutivo", filaResumenEjecutivo(data));
  agregarHoja(wb, "Evolución", filaEvolucionEjecutiva(data));
  agregarHoja(wb, "Por canal", filaComparativo(data));
  agregarHoja(wb, "Diagnóstico", filaDiagnostico(data));
  agregarHoja(wb, "Detalle histórico", data.tabla.map(filaTabla));
  agregarHoja(wb, "Filtros", filaFiltros(meta));

  XLSX.writeFile(wb, nombreArchivo());
}

export function exportarTablaCalidad(
  filas: CalidadFila[],
  meta: CalidadMeta,
): void {
  const wb = XLSX.utils.book_new();
  agregarHoja(wb, "Detalle histórico", filas.map(filaTabla));
  agregarHoja(wb, "Filtros", filaFiltros(meta));
  XLSX.writeFile(wb, nombreArchivo());
}
