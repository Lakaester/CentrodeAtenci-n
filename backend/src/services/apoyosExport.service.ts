/**
 * Exportación Excel de Apoyos (Soporte Especializado).
 * Compatible con la estructura de Detalle de Atenciones para futura consolidación.
 * Una fila por apoyo, columnas alineadas con el modelo de casos de atención.
 */
import ExcelJS from "exceljs";
import { apoyosRepository, type ApoyoRow } from "../repositories/apoyos.repository";
import { DomainError } from "../core/errors/types";

export interface FiltrosExportApoyos {
  desde?: string;
  hasta?: string;
  estado?: string;
  area?: string;
  categoria?: string;
  asesorId?: string;
  dominio?: string;
}

function fmtFecha(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function fmtHora(h: Date | string | null | undefined): string {
  if (!h) return "";
  const s = typeof h === "string" ? h : h.toTimeString().slice(0, 5);
  const parts = s.split(":");
  if (parts.length < 2) return s;
  return `${parts[0]}:${parts[1]}`;
}

function fmtDuracion(min: number | null | undefined): string {
  if (min == null) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function nombreArchivoApoyos(f: FiltrosExportApoyos, hoy = new Date()): string {
  const aaaa = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hoyStr = `${aaaa}-${mm}-${dd}`;
  if (f.desde && f.hasta) return `Apoyos_${f.desde}_${f.hasta}.xlsx`;
  if (f.desde || f.hasta) return `Apoyos_${f.desde ?? f.hasta}_${hoyStr}.xlsx`;
  return `Apoyos_${hoyStr}.xlsx`;
}

function hojaApoyos(ws: ExcelJS.Worksheet, apoyos: ApoyoRow[]) {
  ws.columns = [
    { header: "Ticket", key: "ticket", width: 14 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Canal", key: "canal", width: 12 },
    { header: "Subcanal", key: "subcanal", width: 14 },
    { header: "Asesor", key: "asesor", width: 22 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Categoria", key: "categoria", width: 28 },
    { header: "Subcategoria", key: "subcategoria", width: 28 },
    { header: "Sub-subcategoria", key: "subSubcategoria", width: 30 },
    { header: "Area", key: "area", width: 22 },
    { header: "Dominio", key: "dominio", width: 30 },
    { header: "Cliente", key: "cliente", width: 20 },
    { header: "Hora inicio", key: "horaInicio", width: 12 },
    { header: "Hora fin", key: "horaFin", width: 12 },
    { header: "Duracion", key: "duracion", width: 12 },
    { header: "Persona apoyo", key: "personaApoyo", width: 22 },
    { header: "Comentario", key: "comentario", width: 40 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const a of apoyos) {
    ws.addRow({
      ticket: a.ticket,
      fecha: fmtFecha(a.fecha),
      canal: "Gestion",
      subcanal: "Apoyo",
      asesor: a.asesor_nombre ?? "",
      estado: a.estado ?? "",
      categoria: a.categoria ?? "",
      subcategoria: a.subcategoria_fun ?? "",
      subSubcategoria: a.sub_subcategoria_fun ?? "",
      area: a.area ?? "",
      dominio: a.dominio ?? "",
      cliente: a.cliente_nombre ?? "",
      horaInicio: fmtHora(a.hora_inicio),
      horaFin: fmtHora(a.hora_fin),
      duracion: fmtDuracion(a.duracion_min),
      personaApoyo: a.persona_apoyo ?? "",
      comentario: a.comentario ?? "",
    });
  }
}

export const apoyosExportService = {
  async generar(f: FiltrosExportApoyos): Promise<{ buffer: Buffer; nombre: string; total: number }> {
    const apoyos = await apoyosRepository.listarParaExportar(f);
    if (apoyos.length === 0) {
      throw new DomainError("No hay apoyos para exportar con los filtros seleccionados", "SIN_DATOS");
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "COPE";

    const ws = wb.addWorksheet("Apoyos");
    hojaApoyos(ws, apoyos);

    const buffer = await wb.xlsx.writeBuffer();
    const nombre = nombreArchivoApoyos(f);

    return { buffer: Buffer.from(buffer), nombre, total: apoyos.length };
  },
};
