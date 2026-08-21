/**
 * Exportación Excel del histórico operativo de Quejas y Devoluciones.
 * Replica el formato operativo que usa el equipo: una fila por caso,
 * columnas alineadas con qd_casos y los catálogos. Los montos y
 * porcentajes se escriben como números; las fechas como texto dd/mm/aaaa.
 */
import ExcelJS from "exceljs";
import { qdRepository, type QdCasoRow } from "../repositories/quejasDevoluciones.repository";
import { DomainError } from "../core/errors/types";

export interface FiltrosExportacion {
  tipo?: string;
  desde?: string;
  hasta?: string;
  pais?: string;
  estado?: string;
  resultado?: string;
  asesor?: string;
  area?: string;
  producto?: string;
  tipoQueja?: string;
}

/** Nombre del archivo según el alcance de la exportación. */
export function nombreArchivo(f: FiltrosExportacion, hoy = new Date()): string {
  const base = f.tipo === "devolucion" ? "Devoluciones" : f.tipo === "queja" ? "Quejas" : "Quejas_Devoluciones";
  const aaaa = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hoyStr = `${aaaa}-${mm}-${dd}`;
  if (f.desde && f.hasta) return `${base}_${f.desde}_${f.hasta}.xlsx`;
  if (f.desde || f.hasta) return `${base}_${f.desde ?? f.hasta}_${hoyStr}.xlsx`;
  return `${base}_${hoyStr}.xlsx`;
}

function fmtFecha(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function fmtNum(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Number(v);
}

function fmtPct(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Number(v);
}

/** Devuelve la hoja con el formato oficial de devoluciones. */
function hojaDevoluciones(ws: ExcelJS.Worksheet, casos: QdCasoRow[]) {
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "ID ticket", key: "ticket", width: 12 },
    { header: "Caso", key: "numero", width: 14 },
    { header: "Dominio", key: "dominio", width: 30 },
    { header: "País", key: "pais", width: 12 },
    { header: "Monto solicitado", key: "montoPagado", width: 14 },
    { header: "Moneda", key: "moneda", width: 8 },
    { header: "Tipo monto", key: "tipoMonto", width: 10 },
    { header: "Área causante", key: "area", width: 18 },
    { header: "Motivo", key: "motivo", width: 40 },
    { header: "¿Devolución procedió?", key: "resultado", width: 18 },
    { header: "% conciliación", key: "porcentaje", width: 12 },
    { header: "Monto real a devolver", key: "montoDevuelto", width: 14 },
    { header: "Estado", key: "estado", width: 22 },
    { header: "Asesor", key: "asesor", width: 16 },
    { header: "Observación", key: "observacion", width: 40 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const c of casos) {
    ws.addRow({
      fecha: fmtFecha(c.created_at),
      ticket: c.ticket_id ?? "",
      numero: c.numero,
      dominio: c.dominio ?? "",
      pais: c.pais ?? "",
      montoPagado: fmtNum(c.monto_pagado),
      moneda: c.moneda ?? "",
      tipoMonto: c.tipo_monto ?? "",
      area: c.area ?? "",
      motivo: c.motivo ?? "",
      resultado: c.resultado ?? "",
      porcentaje: fmtPct(c.porcentaje),
      montoDevuelto: fmtNum(c.monto_devuelto),
      estado: c.estado ?? "",
      asesor: c.asesor ?? "",
      observacion: c.observacion ?? "",
    });
  }
}

/** Devuelve la hoja de quejas. No existe formato oficial, por lo que se usa una estructura separada. */
function hojaQuejas(ws: ExcelJS.Worksheet, casos: QdCasoRow[]) {
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "ID ticket", key: "ticket", width: 12 },
    { header: "Caso", key: "numero", width: 14 },
    { header: "Dominio", key: "dominio", width: 30 },
    { header: "País", key: "pais", width: 12 },
    { header: "Tipo de queja", key: "clasificacion", width: 16 },
    { header: "Área", key: "area", width: 18 },
    { header: "Producto", key: "producto", width: 20 },
    { header: "Motivo", key: "motivo", width: 40 },
    { header: "Resultado", key: "resultado", width: 18 },
    { header: "Estado", key: "estado", width: 22 },
    { header: "Asesor", key: "asesor", width: 16 },
    { header: "Observación", key: "observacion", width: 40 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const c of casos) {
    ws.addRow({
      fecha: fmtFecha(c.created_at),
      ticket: c.ticket_id ?? "",
      numero: c.numero,
      dominio: c.dominio ?? "",
      pais: c.pais ?? "",
      clasificacion: c.clasificacion ?? "",
      area: c.area ?? "",
      producto: c.producto ?? "",
      motivo: c.motivo ?? "",
      resultado: c.resultado ?? "",
      estado: c.estado ?? "",
      asesor: c.asesor ?? "",
      observacion: c.observacion ?? "",
    });
  }
}

export const qdExportService = {
  /**
   * Genera el workbook en memoria (Buffer). NO guarda en disco.
   * - respeta los filtros activos
   * - un caso = una fila (no interacciones)
   * - montos/porcentajes calculados ya vienen de qd_casos (backend)
   */
  async generar(f: FiltrosExportacion, usuario: string | null): Promise<{ buffer: Buffer; nombre: string; total: number }> {
    const filtros = { ...f };
    if (filtros.tipo && !["devolucion", "queja", "todas"].includes(filtros.tipo)) {
      throw new DomainError("Tipo de exportación inválido", "TIPO_INVALIDO");
    }

    const casos = await qdRepository.listarConFiltros(filtros);
    const devoluciones = casos.filter((c) => c.tipo === "devolucion");
    const quejas = casos.filter((c) => c.tipo === "queja");

    const wb = new ExcelJS.Workbook();
    wb.creator = "COPE";

    // Según el alcance: replicar solo la(s) hoja(s) correspondiente(s).
    if (!filtros.tipo || filtros.tipo === "todas") {
      const wsDev = wb.addWorksheet("Devoluciones");
      hojaDevoluciones(wsDev, devoluciones);
      const wsQue = wb.addWorksheet("Quejas");
      hojaQuejas(wsQue, quejas);
    } else if (filtros.tipo === "devolucion") {
      const wsDev = wb.addWorksheet("Devoluciones");
      hojaDevoluciones(wsDev, devoluciones);
    } else {
      const wsQue = wb.addWorksheet("Quejas");
      hojaQuejas(wsQue, quejas);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const nombre = nombreArchivo(filtros);

    // Auditoría de la exportación.
    await qdRepository.registrarExportacion({
      usuario,
      tipo: filtros.tipo ?? "todas",
      filtros: {
        desde: filtros.desde ?? null,
        hasta: filtros.hasta ?? null,
        pais: filtros.pais ?? null,
        estado: filtros.estado ?? null,
        resultado: filtros.resultado ?? null,
        asesor: filtros.asesor ?? null,
        area: filtros.area ?? null,
        producto: filtros.producto ?? null,
        tipoQueja: filtros.tipoQueja ?? null,
      },
      registros: casos.length,
    });

    return { buffer: Buffer.from(buffer), nombre, total: casos.length };
  },
};
