import type { GerencialResponse } from "../dto/dashboard.dto";
import { fmtDateShort, fmtInt } from "./format";

export interface Insight {
  id: string;
  tono: "good" | "warn" | "bad" | "neutral";
  titulo: string;
  detalle: string;
  indicador: string;
  periodo: string;
  magnitud: string;
}

function periodoLabel(data: GerencialResponse): string {
  if (!data.rango) return "Periodo seleccionado";
  return `${fmtDateShort(data.rango.inicio)} — ${fmtDateShort(data.rango.fin)}`;
}

export function buildInsights(data: GerencialResponse): Insight[] {
  const out: Insight[] = [];
  const periodo = periodoLabel(data);
  const k = data.kpis;
  const c = data.comparacion;

  // 1. Variación de demanda
  if (c.recibidas.deltaPct != null && Math.abs(c.recibidas.deltaPct) >= 8 && (c.recibidas.anterior ?? 0) >= 20) {
    const up = c.recibidas.deltaPct > 0;
    out.push({
      id: "demanda",
      tono: up ? "warn" : "good",
      titulo: up ? "La demanda aumentó" : "La demanda disminuyó",
      detalle: `${fmtInt(c.recibidas.valor)} atenciones recibidas frente a ${fmtInt(c.recibidas.anterior)} del periodo anterior.`,
      indicador: "Atenciones recibidas",
      periodo,
      magnitud: `${up ? "+" : ""}${c.recibidas.deltaPct.toFixed(1)}%`,
    });
  }

  // 2. Cumplimiento SLA
  if (c.slaPrimeraPct.valor != null && c.slaPrimeraPct.anterior != null) {
    const deltaPts = c.slaPrimeraPct.valor - c.slaPrimeraPct.anterior;
    if (deltaPts <= -1.5 || c.slaPrimeraPct.valor < 80) {
      out.push({
        id: "sla",
        tono: c.slaPrimeraPct.valor < 75 ? "bad" : "warn",
        titulo: "Cumplimiento SLA bajo presión",
        detalle: `SLA de primera respuesta en ${c.slaPrimeraPct.valor.toFixed(1)}% (${fmtInt(k.slaPrimera.dentro)} de ${fmtInt(k.slaPrimera.evaluados)} casos) frente a ${c.slaPrimeraPct.anterior.toFixed(1)}% del periodo anterior.`,
        indicador: "SLA primera respuesta",
        periodo,
        magnitud: `${deltaPts > 0 ? "+" : ""}${deltaPts.toFixed(1)} pp`,
      });
    } else if (deltaPts >= 1.5) {
      out.push({
        id: "sla",
        tono: "good",
        titulo: "Mejora del cumplimiento SLA",
        detalle: `SLA de primera respuesta subió a ${c.slaPrimeraPct.valor.toFixed(1)}% (${fmtInt(k.slaPrimera.dentro)} de ${fmtInt(k.slaPrimera.evaluados)} casos).`,
        indicador: "SLA primera respuesta",
        periodo,
        magnitud: `+${deltaPts.toFixed(1)} pp`,
      });
    }
  }

  // 3. Backlog crítico
  if (k.criticos > 0) {
    out.push({
      id: "backlog",
      tono: k.criticos >= 10 ? "bad" : "warn",
      titulo: "Backlog con casos críticos",
      detalle: `${fmtInt(k.criticos)} casos abiertos superan las 72 horas. ${fmtInt(k.fueraSla)} del backlog están fuera de SLA y ${fmtInt(k.antiguos)} superan 7 días.`,
      indicador: "Backlog / antigüedad",
      periodo: "Al cierre del periodo",
      magnitud: `${fmtInt(k.criticos)} críticos`,
    });
  }

  // 4. Crecimiento de categorías
  const prevCat = new Map(data.distribuciones.categoriaAnterior.map((c) => [c.etiqueta, c.total]));
  let mejor: { categoria: string; actual: number; anterior: number; pct: number } | null = null;
  for (const cat of data.distribuciones.categoria) {
    const anterior = prevCat.get(cat.etiqueta) ?? 0;
    if (anterior < 10 || cat.total - anterior < 8) continue;
    const pct = ((cat.total - anterior) / anterior) * 100;
    if (pct >= 20 && (!mejor || pct > mejor.pct)) {
      mejor = { categoria: cat.etiqueta, actual: cat.total, anterior, pct };
    }
  }
  if (mejor) {
    out.push({
      id: "categoria-crecimiento",
      tono: "warn",
      titulo: "Categoría con mayor crecimiento",
      detalle: `${mejor.categoria} pasó de ${fmtInt(mejor.anterior)} a ${fmtInt(mejor.actual)} atenciones. Revisar causa raíz y carga del equipo.`,
      indicador: "Volumen por categoría",
      periodo,
      magnitud: `+${mejor.pct.toFixed(1)}%`,
    });
  }

  // 5. Concentración de la causa principal
  const topCat = data.distribuciones.categoria[0];
  if (topCat && k.recibidas > 0) {
    const share = (topCat.total / k.recibidas) * 100;
    if (share >= 25) {
      out.push({
        id: "causa-principal",
        tono: "neutral",
        titulo: "Una causa concentra la operación",
        detalle: `${topCat.etiqueta} representa ${share.toFixed(1)}% de las atenciones (${fmtInt(topCat.total)} casos).`,
        indicador: "Distribución por categoría",
        periodo,
        magnitud: `${share.toFixed(1)}%`,
      });
    }
  }

  // 6. Horario pico
  if (data.horas.length > 0 && k.recibidas > 0) {
    const peak = data.horas.reduce((a, b) => (b.total > a.total ? b : a), data.horas[0]);
    const share = (peak.total / k.recibidas) * 100;
    if (share >= 7) {
      out.push({
        id: "horario",
        tono: "neutral",
        titulo: "Horario de mayor carga",
        detalle: `La hora ${String(peak.hora).padStart(2, "0")}:00 concentra ${fmtInt(peak.total)} atenciones (${share.toFixed(1)}% del total).`,
        indicador: "Carga por hora",
        periodo,
        magnitud: `${share.toFixed(1)}%`,
      });
    }
  }

  // 7. Reincidencias
  if (k.gestionadas > 0) {
    const rate = (k.reincidencias / k.gestionadas) * 100;
    if (rate >= 10) {
      out.push({
        id: "reincidencia",
        tono: "warn",
        titulo: "Reincidencias relevantes",
        detalle: `${fmtInt(k.reincidencias)} contactos tuvieron más de una atención finalizada (${rate.toFixed(1)}% sobre ${fmtInt(k.gestionadas)} gestionadas).`,
        indicador: "Reincidencias por contacto",
        periodo,
        magnitud: `${rate.toFixed(1)}%`,
      });
    }
  }

  // 8. Concentración de carga en un asesor
  const topAsesor = data.asesores[0];
  if (topAsesor && k.recibidas > 0) {
    const share = (topAsesor.total / k.recibidas) * 100;
    if (share >= 35) {
      out.push({
        id: "sobrecarga",
        tono: "warn",
        titulo: "Carga concentrada en un asesor",
        detalle: `${topAsesor.asesor} concentra ${share.toFixed(1)}% del volumen (${fmtInt(topAsesor.total)} atenciones). Revisar distribución y complejidad.`,
        indicador: "Volumen por asesor",
        periodo,
        magnitud: `${share.toFixed(1)}%`,
      });
    }
  }

  return out.slice(0, 6);
}
