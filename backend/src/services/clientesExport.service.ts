/**
 * Exportación del reporte Clientes.
 *
 * Niveles:
 *  - clientes: Excel con todos los clientes identificados que cumplen los filtros.
 *  - categorias: Excel con las categorías del cliente seleccionado.
 *  - subcategorias: Excel con las subcategorías de la categoría seleccionada.
 *  - tickets: CSV con los tickets del nivel seleccionado.
 *
 * La exportación respeta el nivel, los filtros globales y la búsqueda; no
 * exporta la jerarquía completa cuando se consulta un nivel inferior.
 */
import ExcelJS from "exceljs";
import { unificadoRepository } from "../repositories/unificado.repository";
import { DomainError } from "../core/errors/types";
import type { DashboardFilters } from "../types";

export type NivelExportacion = "clientes" | "categorias" | "subcategorias" | "tickets";

export interface ParametrosExportacion {
  nivel: NivelExportacion;
  clave?: string;
  categoria?: string;
  subcategoria?: string;
  search?: string;
}

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV = "text/csv; charset=utf-8";

function nombreArchivo(nivel: NivelExportacion, filters: DashboardFilters, ext: string): string {
  const hoy = new Date().toISOString().slice(0, 10);
  const d = filters.fechaHoraInicio?.slice(0, 10) ?? "";
  const h = filters.fechaHoraFin?.slice(0, 10) ?? "";
  const rango = d && h ? `${d}_${h}` : hoy;
  return `Clientes_${nivel}_${rango}.${ext}`;
}

const num = (v: number | null | undefined) =>
  v == null ? "" : Math.round(v * 10) / 10;

const pct = (v: number | null | undefined) => (v == null ? "" : `${Math.round(v * 10) / 10}%`);

const canalLabel = (c: string) => {
  const v = (c ?? "").toUpperCase();
  if (v === "WHATMETA") return "WAMETA";
  if (v === "WHATICKET") return "WATICKET";
  if (v === "ZENDESK") return "ZENDESK";
  return c;
};

const estadoLabel = (e: string) => {
  const v = (e ?? "").toLowerCase();
  if (v === "cerrado") return "Cerrado";
  if (v === "resuelto") return "Resuelto";
  if (v === "abierto") return "Abierto";
  if (v === "sin_mapear") return "Sin homologar";
  return e;
};

const slaLabel = (v: boolean | null) => (v == null ? "Sin dato" : v ? "Sí" : "No");

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export const clientesExportService = {
  async generar(
    filters: DashboardFilters,
    params: ParametrosExportacion,
  ): Promise<{ buffer: Buffer; nombre: string; total: number; contentType: string }> {
    if (params.nivel === "clientes") {
      const data = await unificadoRepository.clientesLista(filters, {
        all: true,
        search: params.search,
      });
      if (!data.rows.length) {
        throw new DomainError("No hay clientes para exportar con los filtros seleccionados", "SIN_DATOS");
      }

      const wb = new ExcelJS.Workbook();
      wb.creator = "COPE";
      const ws = wb.addWorksheet("Clientes");
      ws.columns = [
        { header: "Cliente", key: "cliente", width: 38 },
        { header: "Atenciones", key: "total", width: 12 },
        { header: "% del total identificado", key: "pct", width: 20 },
        { header: "Variación vs. periodo anterior", key: "variacion", width: 22 },
        { header: "Tiempo promedio (min)", key: "tiempo", width: 18 },
        { header: "Evaluables SLA", key: "conDato", width: 14 },
        { header: "Incumplen SLA", key: "noCumple", width: 14 },
        { header: "% incumplimiento SLA", key: "pctIncumple", width: 18 },
        { header: "Reincidencia máxima", key: "reincidencia", width: 18 },
        { header: "Canales", key: "canales", width: 22 },
        { header: "Última atención", key: "ultima", width: 16 },
      ];
      ws.getRow(1).font = { bold: true };
      for (const r of data.rows) {
        ws.addRow({
          cliente: r.cliente,
          total: r.total,
          pct: pct(r.pct),
          variacion: pct(r.variacionPct),
          tiempo: num(r.tiempoPromedio),
          conDato: r.conDato,
          noCumple: r.noCumple,
          pctIncumple: pct(r.pctIncumple),
          reincidencia: r.reincidenciaMax,
          canales: r.canales
            .map((c) => (c === "whatsapp" ? "WhatsApp" : c === "correo" ? "Correo" : c))
            .join(", "),
          ultima: r.ultimaAtencion ?? "",
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      return {
        buffer: Buffer.from(buffer),
        nombre: nombreArchivo("clientes", filters, "xlsx"),
        total: data.total,
        contentType: XLSX,
      };
    }

    if (params.nivel === "categorias") {
      if (!params.clave) throw new DomainError("Falta el cliente para exportar categorías", "PARAMETROS");
      const data = await unificadoRepository.clienteCategorias(filters, params.clave);
      if (!data.categorias.length) {
        throw new DomainError("No hay categorías para exportar", "SIN_DATOS");
      }

      const wb = new ExcelJS.Workbook();
      wb.creator = "COPE";
      const ws = wb.addWorksheet("Categorias");
      ws.columns = [
        { header: "Cliente", key: "cliente", width: 38 },
        { header: "Categoría", key: "categoria", width: 34 },
        { header: "Atenciones", key: "total", width: 12 },
        { header: "% del cliente", key: "pct", width: 14 },
        { header: "Tiempo promedio (min)", key: "tiempo", width: 18 },
        { header: "Evaluables SLA", key: "conDato", width: 14 },
        { header: "Incumplen SLA", key: "noCumple", width: 14 },
        { header: "% incumplimiento SLA", key: "pctIncumple", width: 18 },
      ];
      ws.getRow(1).font = { bold: true };
      for (const r of data.categorias) {
        ws.addRow({
          cliente: data.cliente,
          categoria: r.categoria,
          total: r.total,
          pct: pct(r.pct),
          tiempo: num(r.tiempoPromedio),
          conDato: r.conDato,
          noCumple: r.noCumple,
          pctIncumple: pct(r.pctIncumple),
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      return {
        buffer: Buffer.from(buffer),
        nombre: nombreArchivo("categorias", filters, "xlsx"),
        total: data.categorias.length,
        contentType: XLSX,
      };
    }

    if (params.nivel === "subcategorias") {
      if (!params.clave || !params.categoria) {
        throw new DomainError("Faltan cliente y categoría para exportar subcategorías", "PARAMETROS");
      }
      const data = await unificadoRepository.clienteSubcategorias(
        filters,
        params.clave,
        params.categoria,
      );
      if (!data.subcategorias.length) {
        throw new DomainError("No hay subcategorías para exportar", "SIN_DATOS");
      }

      const wb = new ExcelJS.Workbook();
      wb.creator = "COPE";
      const ws = wb.addWorksheet("Subcategorias");
      ws.columns = [
        { header: "Cliente", key: "cliente", width: 38 },
        { header: "Categoría", key: "categoria", width: 34 },
        { header: "Subcategoría", key: "subcategoria", width: 38 },
        { header: "Atenciones", key: "total", width: 12 },
        { header: "% de la categoría", key: "pct", width: 16 },
        { header: "Tiempo promedio (min)", key: "tiempo", width: 18 },
        { header: "Evaluables SLA", key: "conDato", width: 14 },
        { header: "Incumplen SLA", key: "noCumple", width: 14 },
        { header: "% incumplimiento SLA", key: "pctIncumple", width: 18 },
      ];
      ws.getRow(1).font = { bold: true };
      for (const r of data.subcategorias) {
        ws.addRow({
          cliente: data.cliente,
          categoria: data.categoria,
          subcategoria: r.subcategoria,
          total: r.total,
          pct: pct(r.pct),
          tiempo: num(r.tiempoPromedio),
          conDato: r.conDato,
          noCumple: r.noCumple,
          pctIncumple: pct(r.pctIncumple),
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      return {
        buffer: Buffer.from(buffer),
        nombre: nombreArchivo("subcategorias", filters, "xlsx"),
        total: data.subcategorias.length,
        contentType: XLSX,
      };
    }

    /* tickets */
    if (!params.clave || !params.categoria || !params.subcategoria) {
      throw new DomainError("Faltan cliente, categoría y subcategoría para exportar tickets", "PARAMETROS");
    }
    const data = await unificadoRepository.clienteTickets(filters, {
      clave: params.clave,
      categoria: params.categoria,
      subcategoria: params.subcategoria,
      all: true,
    });
    if (!data.rows.length) {
      throw new DomainError("No hay tickets para exportar", "SIN_DATOS");
    }

    const header = [
      "Ticket",
      "Canal",
      "Fecha",
      "Categoría",
      "Subcategoría",
      "Dominio",
      "Contacto",
      "Número",
      "Asesor",
      "Estado",
      "Tiempo resolución (min)",
      "Cumple SLA",
      "Umbral (min)",
      "URL ticket",
    ];
    const rows = data.rows.map((r) => [
      r.ticket,
      canalLabel(r.canal),
      r.fecha,
      r.categoria,
      r.subcategoria,
      r.dominio,
      r.contacto ?? "",
      r.numero ?? "",
      r.asesor,
      estadoLabel(r.estado),
      num(r.tiempoResolucion),
      slaLabel(r.cumpleSla),
      r.umbralMinutos,
      r.urlTicket ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const buffer = Buffer.from(`\uFEFF${csv}`, "utf8");

    return {
      buffer,
      nombre: nombreArchivo("tickets", filters, "csv"),
      total: data.total,
      contentType: CSV,
    };
  },
};
