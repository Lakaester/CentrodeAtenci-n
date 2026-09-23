/**
 * Exportación Excel del Explorador de Clientes.
 * Genera un archivo .xlsx con múltiples hojas:
 *   1. Jerarquía (Cliente → Canal → Categoría → Subcategoría)
 *   2. Ranking Top 20
 *   3. Clientes en Riesgo
 */
import ExcelJS from "exceljs";
import { unificadoRepository } from "../repositories/unificado.repository";
import { DomainError } from "../core/errors/types";
import type { DashboardFilters, ClientesV2Response } from "../types";

function nombreArchivo(f: DashboardFilters, hoy = new Date()): string {
  const aaaa = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hoyStr = `${aaaa}-${mm}-${dd}`;
  const d = f.fechaHoraInicio ?? "";
  const h = f.fechaHoraFin ?? "";
  if (d && h) return `Clientes_${d}_${h}.xlsx`;
  if (d || h) return `Clientes_${d || h}_${hoyStr}.xlsx`;
  return `Clientes_${hoyStr}.xlsx`;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return "";
  return String(Math.round(v * 10) / 10);
}

function hojaJerarquia(ws: ExcelJS.Worksheet, data: ClientesV2Response["jerarquia"]) {
  ws.columns = [
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "Canal", key: "canal", width: 14 },
    { header: "Categoria", key: "categoria", width: 28 },
    { header: "Subcategoria", key: "subcategoria", width: 28 },
    { header: "Cantidad", key: "total", width: 12 },
    { header: "T. Espera (min)", key: "tiempo_espera", width: 16 },
    { header: "T. Resolucion (min)", key: "tiempo_resolucion", width: 18 },
    { header: "SLA (%)", key: "sla", width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of data) {
    ws.addRow({
      cliente: r.cliente,
      canal: r.canal,
      categoria: r.categoria,
      subcategoria: r.subcategoria,
      total: r.total,
      tiempo_espera: fmtNum(r.tiempo_espera),
      tiempo_resolucion: fmtNum(r.tiempo_resolucion),
      sla: fmtNum(r.sla),
    });
  }
}

function hojaRanking(ws: ExcelJS.Worksheet, data: ClientesV2Response["ranking"]) {
  ws.columns = [
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "Cantidad", key: "total", width: 12 },
    { header: "%", key: "pct", width: 10 },
    { header: "T. Espera (min)", key: "tiempo_espera", width: 16 },
    { header: "T. Resolucion (min)", key: "tiempo_resolucion", width: 18 },
    { header: "SLA (%)", key: "sla", width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of data) {
    ws.addRow({
      cliente: r.cliente,
      total: r.total,
      pct: fmtNum(r.pct),
      tiempo_espera: fmtNum(r.tiempo_espera),
      tiempo_resolucion: fmtNum(r.tiempo_resolucion),
      sla: fmtNum(r.sla),
    });
  }
}

function hojaRiesgo(ws: ExcelJS.Worksheet, data: ClientesV2Response["riesgo"]) {
  ws.columns = [
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "Score", key: "score", width: 10 },
    { header: "Nivel", key: "nivel", width: 12 },
    { header: "Cantidad", key: "total", width: 12 },
    { header: "T. Resolucion (min)", key: "tiempo_resolucion", width: 18 },
    { header: "SLA (%)", key: "sla", width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of data) {
    ws.addRow({
      cliente: r.cliente,
      score: r.score,
      nivel: r.nivel,
      total: r.total,
      tiempo_resolucion: fmtNum(r.tiempo_resolucion),
      sla: fmtNum(r.sla),
    });
  }
}

export const clientesExportService = {
  async generar(filters: DashboardFilters): Promise<{ buffer: Buffer; nombre: string; total: number }> {
    const data = await unificadoRepository.clientesV2(filters);
    if (!data.jerarquia.length && !data.ranking.length && !data.riesgo.length) {
      throw new DomainError("No hay datos de clientes para exportar con los filtros seleccionados", "SIN_DATOS");
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "COPE";

    const ws1 = wb.addWorksheet("Explorador de Clientes");
    hojaJerarquia(ws1, data.jerarquia);

    const ws2 = wb.addWorksheet("Ranking Top 20");
    hojaRanking(ws2, data.ranking);

    const ws3 = wb.addWorksheet("Clientes en Riesgo");
    hojaRiesgo(ws3, data.riesgo);

    const buffer = await wb.xlsx.writeBuffer();
    const nombre = nombreArchivo(filters);

    return { buffer: Buffer.from(buffer), nombre, total: data.jerarquia.length };
  },
};
