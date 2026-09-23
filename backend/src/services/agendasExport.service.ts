/**
 * Exportación Excel de Agendas (Reuniones y Capacitaciones).
 * Compatible con la estructura de Detalle de Atenciones para futura consolidación.
 * Una fila por agenda, columnas alineadas con el modelo de casos de atención.
 */
import ExcelJS from "exceljs";
import { agendasRepository, type AgendaRow } from "../repositories/agendas.repository";
import { DomainError } from "../core/errors/types";

export interface FiltrosExportAgendas {
  desde?: string;
  hasta?: string;
  estado?: string;
  tipo?: string;
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

export function nombreArchivoAgendas(f: FiltrosExportAgendas, hoy = new Date()): string {
  const aaaa = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hoyStr = `${aaaa}-${mm}-${dd}`;
  if (f.desde && f.hasta) return `Agendas_${f.desde}_${f.hasta}.xlsx`;
  if (f.desde || f.hasta) return `Agendas_${f.desde ?? f.hasta}_${hoyStr}.xlsx`;
  return `Agendas_${hoyStr}.xlsx`;
}

const TIPO_LABEL: Record<string, string> = {
  REUNION: "Reunión",
  CAPACITACION: "Capacitación",
};

function hojaAgendas(ws: ExcelJS.Worksheet, agendas: AgendaRow[]) {
  ws.columns = [
    { header: "Ticket", key: "ticket", width: 14 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Canal", key: "canal", width: 12 },
    { header: "Subcanal", key: "subcanal", width: 14 },
    { header: "Tipo", key: "tipo", width: 16 },
    { header: "Asesor", key: "asesor", width: 22 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Dominio", key: "dominio", width: 30 },
    { header: "Cliente", key: "cliente", width: 20 },
    { header: "Telefono", key: "clienteNumero", width: 16 },
    { header: "Hora inicio", key: "horaInicio", width: 12 },
    { header: "Hora fin", key: "horaFin", width: 12 },
    { header: "Duracion", key: "duracion", width: 12 },
    { header: "Descripcion", key: "descripcion", width: 40 },
    { header: "Grabacion", key: "grabacionUrl", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const a of agendas) {
    ws.addRow({
      ticket: a.ticket,
      fecha: fmtFecha(a.fecha),
      canal: "Gestion",
      subcanal: "Agenda",
      tipo: TIPO_LABEL[a.tipo] ?? a.tipo,
      asesor: a.asesor_nombre ?? "",
      estado: a.estado ?? "",
      dominio: a.dominio ?? "",
      cliente: a.cliente_nombre ?? "",
      clienteNumero: a.cliente_numero ?? "",
      horaInicio: fmtHora(a.hora_inicio),
      horaFin: fmtHora(a.hora_fin),
      duracion: fmtDuracion(a.duracion_min),
      descripcion: a.descripcion ?? "",
      grabacionUrl: a.grabacion_url ?? "",
    });
  }
}

export const agendasExportService = {
  async generar(f: FiltrosExportAgendas): Promise<{ buffer: Buffer; nombre: string; total: number }> {
    const agendas = await agendasRepository.listarParaExportar(f);
    if (agendas.length === 0) {
      throw new DomainError("No hay agendas para exportar con los filtros seleccionados", "SIN_DATOS");
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "COPE";

    const ws = wb.addWorksheet("Agendas");
    hojaAgendas(ws, agendas);

    const buffer = await wb.xlsx.writeBuffer();
    const nombre = nombreArchivoAgendas(f);

    return { buffer: Buffer.from(buffer), nombre, total: agendas.length };
  },
};
