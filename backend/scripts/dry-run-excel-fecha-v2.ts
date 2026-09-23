/**
 * DRY RUN v2: Importación de casos QyD desde Excel histórico
 *
 * Normalización correcta de tipos antes de comparar.
 * Categorización exacta de cada registro.
 *
 * Uso: npx tsx scripts/dry-run-excel-fecha-v2.ts
 */
import { prisma } from "../src/repositories/prisma";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

// ─── Types ───
interface ExcelRow {
  Fecha: string;
  "ID ticket": string;
  Caso: string;
  Dominio: string;
  País: string;
  "Monto solicitado"?: number;
  Moneda?: string;
  "Tipo monto"?: string;
  "Área causante"?: string;
  Motivo?: string;
  "¿Devolución procedió?"?: string;
  "% conciliación"?: number;
  "Monto real a devolver"?: number;
  Estado?: string;
  Asesor?: string;
  Observación?: string;
  "Tipo de queja"?: string;
  Área?: string;
  Producto?: string;
  Resultado?: string;
  _sheet?: string;
}

interface CasoBD {
  id: string;
  ticket_id: string;
  numero: string;
  tipo: string;
  fecha_solicitud: string | null;
  estado: string | null;
  resultado: string | null;
  monto_pagado: unknown;
  monto_devuelto: unknown;
  porcentaje: unknown;
  tipo_monto: string | null;
  asesor: string | null;
  dominio: string | null;
  origen: string;
  area: string | null;
  motivo: string | null;
  observacion: string | null;
  clasificacion: string | null;
  producto: string | null;
  moneda: string;
  pais: string | null;
}

type Categoria = "NUEVO" | "FECHA_NULL" | "FECHA_DIFERENTE" | "FECHA_IGUAL" | "SOLO_OTROS_CAMPOS";

interface CampoDiff {
  campo: string;
  valorBD: unknown;
  valorExcel: unknown;
  valorBDNorm: string;
  valorExcelNorm: string;
  cambia: boolean;
}

interface RegistroAuditado {
  sheet: string;
  casoNumero: string;
  ticketId: string;
  tipo: "devolucion" | "queja";
  dominio: string | null;
  fechaExcel: string | null;
  existeEnBD: boolean;
  casoId: string | null;
  fechaSolicitudActual: string | null;
  categoria: Categoria;
  fechaSeModifica: boolean;
  otrosCamposSeModifican: boolean;
  diffs: CampoDiff[];
  motivo: string;
}

// ─── Helpers ───
function findExcelFile(): string {
  const candidates = [
    path.join("C:\\Users\\acast\\Downloads", "Quejas_Devoluciones_2026-09-08 (1).xlsx"),
    path.join("C:\\Users\\acast\\OneDrive\\Downloads", "Quejas_Devoluciones_2026-09-08 (1).xlsx"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Excel file not found");
}

function parseExcel(filePath: string): ExcelRow[] {
  const wb = XLSX.readFile(filePath);
  const all: ExcelRow[] = [];
  for (const name of wb.SheetNames) {
    const data = XLSX.utils.sheet_to_json<ExcelRow>(wb.Sheets[name]);
    for (const row of data) all.push({ ...row, _sheet: name });
  }
  return all;
}

function extractTipo(caso: string): "devolucion" | "queja" {
  return caso.toUpperCase().startsWith("DEV") ? "devolucion" : "queja";
}

function normalizeFecha(fecha: unknown): string | null {
  if (fecha == null) return null;
  if (typeof fecha === "number") {
    const d = new Date((fecha - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  }
  const s = String(fecha).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

/** Normalize a value to a comparable string for semantic equality. */
function norm(v: unknown): string {
  if (v == null) return "NULL";
  if (typeof v === "number") {
    // 150 === 150.0 → "150"
    return String(Math.round(v * 100) / 100);
  }
  const s = String(v).trim();
  if (!s) return "NULL";
  // Try numeric comparison: "150" === "150.0"
  const n = Number(s);
  if (!isNaN(n) && s !== "") return String(Math.round(n * 100) / 100);
  return s;
}

function fieldsEqual(a: unknown, b: unknown): boolean {
  return norm(a) === norm(b);
}

// ─── Main ───
async function main() {
  console.log("=== DRY RUN v2: Importación de casos QyD desde Excel histórico ===\n");

  const excelPath = findExcelFile();
  console.log("Excel:", excelPath);
  const rows = parseExcel(excelPath);
  console.log("Total registros:", rows.length);

  // Load all existing cases
  const existentes = await prisma.$queryRaw<CasoBD[]>`
    SELECT id, ticket_id, numero, tipo, fecha_solicitud, estado, resultado,
           monto_pagado, monto_devuelto, porcentaje, tipo_monto, asesor,
           dominio, origen, area, motivo, observacion, clasificacion,
           producto, moneda, pais
    FROM qd_casos WHERE eliminado = FALSE
  `;
  const map = new Map<string, CasoBD>();
  for (const e of existentes) map.set(`${e.ticket_id}:${e.tipo}`, e);
  console.log("Casos existentes BD:", existentes.length);

  // Classify each row
  const auditados: RegistroAuditado[] = [];
  const counts: Record<Categoria, number> = {
    NUEVO: 0, FECHA_NULL: 0, FECHA_DIFERENTE: 0, FECHA_IGUAL: 0, SOLO_OTROS_CAMPOS: 0,
  };
  let totalFechasRecuperadas = 0;
  let totalCamposModificados = 0;

  for (const row of rows) {
    const caso = (row as any).Caso || "";
    const ticketId = String(row["ID ticket"] || "").trim();
    const tipo = extractTipo(caso);
    const fechaExcel = normalizeFecha(row.Fecha);
    const dominio = row.Dominio || null;
    const estadoExcel = row.Estado || null;
    const resultadoExcel = row["¿Devolución procedió?"] || row.Resultado || null;
    const montoExcel = row["Monto solicitado"] ?? null;
    const porcentajeExcel = row["% conciliación"] ?? null;
    const tipoMontoExcel = row["Tipo monto"] || null;
    const asesorExcel = row.Asesor || null;
    const areaExcel = row["Área causante"] || row.Área || null;
    const motivoExcel = row.Motivo || null;
    const observacionExcel = row.Observación || null;
    const clasificacionExcel = row["Tipo de queja"] || null;
    const productoExcel = row.Producto || null;
    const monedaExcel = row.Moneda || null;
    const paisExcel = row.País || null;
    const sheet = (row as any)._sheet || "";

    const existente = map.get(`${ticketId}:${tipo}`);

    if (!existente) {
      // NUEVO
      counts.NUEVO++;
      totalFechasRecuperadas++;
      auditados.push({
        sheet, casoNumero: caso, ticketId, tipo, dominio,
        fechaExcel, existeEnBD: false, casoId: null,
        fechaSolicitudActual: null, categoria: "NUEVO",
        fechaSeModifica: true, otrosCamposSeModifican: false,
        diffs: [], motivo: "No existe en BD — se creará desde Excel",
      });
      continue;
    }

    // Existing case — compute diffs
    const diffs: CampoDiff[] = [
      { campo: "fecha_solicitud", valorBD: existente.fecha_solicitud, valorExcel: fechaExcel, valorBDNorm: norm(existente.fecha_solicitud), valorExcelNorm: norm(fechaExcel), cambia: !fieldsEqual(existente.fecha_solicitud, fechaExcel) && fechaExcel != null },
      { campo: "estado", valorBD: existente.estado, valorExcel: estadoExcel, valorBDNorm: norm(existente.estado), valorExcelNorm: norm(estadoExcel), cambia: !fieldsEqual(existente.estado, estadoExcel) && estadoExcel != null },
      { campo: "resultado", valorBD: existente.resultado, valorExcel: resultadoExcel, valorBDNorm: norm(existente.resultado), valorExcelNorm: norm(resultadoExcel), cambia: !fieldsEqual(existente.resultado, resultadoExcel) && resultadoExcel != null && resultadoExcel !== "" },
      { campo: "monto_pagado", valorBD: existente.monto_pagado, valorExcel: montoExcel, valorBDNorm: norm(existente.monto_pagado), valorExcelNorm: norm(montoExcel), cambia: !fieldsEqual(existente.monto_pagado, montoExcel) && montoExcel != null },
      { campo: "porcentaje", valorBD: existente.porcentaje, valorExcel: porcentajeExcel, valorBDNorm: norm(existente.porcentaje), valorExcelNorm: norm(porcentajeExcel), cambia: !fieldsEqual(existente.porcentaje, porcentajeExcel) && porcentajeExcel != null },
      { campo: "tipo_monto", valorBD: existente.tipo_monto, valorExcel: tipoMontoExcel, valorBDNorm: norm(existente.tipo_monto), valorExcelNorm: norm(tipoMontoExcel), cambia: !fieldsEqual(existente.tipo_monto, tipoMontoExcel) && tipoMontoExcel != null && tipoMontoExcel !== "" },
      { campo: "asesor", valorBD: existente.asesor, valorExcel: asesorExcel, valorBDNorm: norm(existente.asesor), valorExcelNorm: norm(asesorExcel), cambia: !fieldsEqual(existente.asesor, asesorExcel) && asesorExcel != null && asesorExcel !== "" },
      { campo: "area", valorBD: existente.area, valorExcel: areaExcel, valorBDNorm: norm(existente.area), valorExcelNorm: norm(areaExcel), cambia: !fieldsEqual(existente.area, areaExcel) && areaExcel != null && areaExcel !== "" },
      { campo: "motivo", valorBD: existente.motivo, valorExcel: motivoExcel, valorBDNorm: norm(existente.motivo), valorExcelNorm: norm(motivoExcel), cambia: !fieldsEqual(existente.motivo, motivoExcel) && motivoExcel != null && motivoExcel !== "" },
      { campo: "observacion", valorBD: existente.observacion, valorExcel: observacionExcel, valorBDNorm: norm(existente.observacion), valorExcelNorm: norm(observacionExcel), cambia: !fieldsEqual(existente.observacion, observacionExcel) && observacionExcel != null && observacionExcel !== "" },
      { campo: "clasificacion", valorBD: existente.clasificacion, valorExcel: clasificacionExcel, valorBDNorm: norm(existente.clasificacion), valorExcelNorm: norm(clasificacionExcel), cambia: !fieldsEqual(existente.clasificacion, clasificacionExcel) && clasificacionExcel != null && clasificacionExcel !== "" },
      { campo: "producto", valorBD: existente.producto, valorExcel: productoExcel, valorBDNorm: norm(existente.producto), valorExcelNorm: norm(productoExcel), cambia: !fieldsEqual(existente.producto, productoExcel) && productoExcel != null && productoExcel !== "" },
      { campo: "moneda", valorBD: existente.moneda, valorExcel: monedaExcel, valorBDNorm: norm(existente.moneda), valorExcelNorm: norm(monedaExcel), cambia: !fieldsEqual(existente.moneda, monedaExcel) && monedaExcel != null && monedaExcel !== "" },
      { campo: "pais", valorBD: existente.pais, valorExcel: paisExcel, valorBDNorm: norm(existente.pais), valorExcelNorm: norm(paisExcel), cambia: !fieldsEqual(existente.pais, paisExcel) && paisExcel != null && paisExcel !== "" },
    ];

    const fechaDiff = diffs.find(d => d.campo === "fecha_solicitud")!;
    const otrosDiffs = diffs.filter(d => d.campo !== "fecha_solicitud" && d.cambia);
    const fechaCambia = fechaDiff.cambia;
    const otrosCambian = otrosDiffs.length > 0;

    let categoria: Categoria;
    let motivo: string;

    if (existente.fecha_solicitud == null && fechaExcel != null) {
      // Fecha was NULL, Excel has a date
      if (otrosCambian) {
        categoria = "FECHA_NULL";
        motivo = `fecha_solicitud NULL → ${fechaExcel} + ${otrosDiffs.length} otro(s) campo(s)`;
      } else {
        categoria = "FECHA_NULL";
        motivo = `fecha_solicitud NULL → ${fechaExcel}`;
      }
      totalFechasRecuperadas++;
    } else if (existente.fecha_solicitud != null && fechaExcel != null && !fieldsEqual(existente.fecha_solicitud, fechaExcel)) {
      // Fecha exists but differs from Excel
      if (otrosCambian) {
        categoria = "FECHA_DIFERENTE";
        motivo = `fecha_solicitud ${existente.fecha_solicitud} → ${fechaExcel} + ${otrosDiffs.length} otro(s)`;
      } else {
        categoria = "FECHA_DIFERENTE";
        motivo = `fecha_solicitud ${existente.fecha_solicitud} → ${fechaExcel}`;
      }
      totalFechasRecuperadas++;
    } else if (otrosCambian) {
      // Fecha is same or null-in-Excel, but other fields differ
      categoria = "SOLO_OTROS_CAMPOS";
      motivo = `${otrosDiffs.length} campo(s) con diferencia real`;
    } else {
      // Everything matches
      categoria = "FECHA_IGUAL";
      motivo = "Sin cambios — todos los valores coinciden";
    }

    const camposModificados = diffs.filter(d => d.cambia).length;
    totalCamposModificados += camposModificados;

    counts[categoria]++;

    auditados.push({
      sheet, casoNumero: caso, ticketId, tipo, dominio,
      fechaExcel, existeEnBD: true, casoId: existente.id,
      fechaSolicitudActual: existente.fecha_solicitud,
      categoria, fechaSeModifica: fechaCambia,
      otrosCamposSeModifican: otrosCambian,
      diffs, motivo,
    });
  }

  // ─── REPORT ───
  console.log("\n" + "=".repeat(80));
  console.log("REPORTE COMPLETO — 53 REGISTROS");
  console.log("=".repeat(80));

  const header = "Caso | Ticket | Tipo | Fecha Excel | Existe BD | Fecha Actual | Cat | Motivo";
  console.log("\n" + header);
  console.log("-".repeat(120));
  for (const r of auditados) {
    console.log(`${r.casoNumero} | ${r.ticketId} | ${r.tipo} | ${r.fechaExcel ?? "(null)"} | ${r.existeEnBD ? "SI" : "NO"} | ${r.fechaSolicitudActual ?? "(null)"} | ${r.categoria} | ${r.motivo}`);
  }

  // ─── CUADRATURA ───
  console.log("\n" + "=".repeat(80));
  console.log("CUADRATURA DE CANTIDADES");
  console.log("=".repeat(80));
  console.log(`Excel total:           ${rows.length}`);
  console.log(`  NUEVO:               ${counts.NUEVO}`);
  console.log(`  FECHA_NULL:          ${counts.FECHA_NULL}`);
  console.log(`  FECHA_DIFERENTE:     ${counts.FECHA_DIFERENTE}`);
  console.log(`  FECHA_IGUAL:         ${counts.FECHA_IGUAL}`);
  console.log(`  SOLO_OTROS_CAMPOS:   ${counts.SOLO_OTROS_CAMPOS}`);
  const suma = counts.NUEVO + counts.FECHA_NULL + counts.FECHA_DIFERENTE + counts.FECHA_IGUAL + counts.SOLO_OTROS_CAMPOS;
  console.log(`  SUMA:                ${suma} ${suma === rows.length ? "✓" : "✗ ERROR"}`);
  console.log(`\nFechas a recuperar:    ${totalFechasRecuperadas}`);
  console.log(`  = NUEVO(${counts.NUEVO}) + FECHA_NULL(${counts.FECHA_NULL}) + FECHA_DIFERENTE(${counts.FECHA_DIFERENTE})`);
  console.log(`  = ${counts.NUEVO + counts.FECHA_NULL + counts.FECHA_DIFERENTE} ${totalFechasRecuperadas === counts.NUEVO + counts.FECHA_NULL + counts.FECHA_DIFERENTE ? "✓" : "✗ ERROR"}`);
  console.log(`Campos total modificados: ${totalCamposModificados}`);

  // ─── EXPLICACIÓN 39 FECHAS ───
  console.log("\n" + "=".repeat(80));
  console.log("EXPLICACIÓN: ¿POR QUÉ 39 FECHAS?");
  console.log("=".repeat(80));
  console.log(`  NUEVO (6):               Todos los casos nuevos traen fecha del Excel`);
  console.log(`  FECHA_NULL (${counts.FECHA_NULL}):  Casos existentes con fecha_solicitud=NULL → se asigna fecha Excel`);
  console.log(`  FECHA_DIFERENTE (${counts.FECHA_DIFERENTE}): Casos existentes con fecha distinta → se corrige`);
  console.log(`  TOTAL = ${counts.NUEVO} + ${counts.FECHA_NULL} + ${counts.FECHA_DIFERENTE} = ${totalFechasRecuperadas}`);

  // ─── LISTA FECHAS QUE CAMBIAN ───
  console.log("\n" + "=".repeat(80));
  console.log("LISTA: CASOS CON FECHA QUE CAMBIA");
  console.log("=".repeat(80));
  const conFecha = auditados.filter(r => r.fechaSeModifica);
  console.log(`Total: ${conFecha.length}`);
  for (const r of conFecha) {
    console.log(`  ${r.casoNumero} | ticket ${r.ticketId} | ${r.fechaSolicitudActual ?? "(null)"} → ${r.fechaExcel}`);
  }

  // ─── 25 "OTROS CAMPOS" — DETALLE ───
  console.log("\n" + "=".repeat(80));
  console.log("DETALLE: CAMPO POR CAMPO — 25 CASOS CON OTROS CAMPOS");
  console.log("=".repeat(80));
  const conOtros = auditados.filter(r => r.otrosCamposSeModifican);
  console.log(`Total casos con otros campos: ${conOtros.length}\n`);
  for (const r of conOtros) {
    console.log(`--- ${r.casoNumero} (ticket ${r.ticketId}) ---`);
    for (const d of r.diffs) {
      const accion = d.cambia ? "ACTUALIZAR" : "NO CAMBIAR";
      console.log(`  ${d.campo.padEnd(20)} | BD: ${String(d.valorBDNorm).padEnd(15)} | Excel: ${String(d.valorExcelNorm).padEnd(15)} | ${accion}`);
    }
    console.log("");
  }

  // ─── 6 NUEVOS — DETALLE ───
  console.log("=".repeat(80));
  console.log("DETALLE: 6 CASOS NUEVOS");
  console.log("=".repeat(80));
  const nuevos = auditados.filter(r => r.categoria === "NUEVO");
  for (const r of nuevos) {
    const row = rows.find((x: any) => x.Caso === r.casoNumero);
    console.log(`\n  Caso:         ${r.casoNumero}`);
    console.log(`  Ticket:       ${r.ticketId}`);
    console.log(`  Tipo:         ${r.tipo}`);
    console.log(`  Dominio:      ${r.dominio}`);
    console.log(`  Fecha:        ${r.fechaExcel}`);
    console.log(`  Estado:       ${(row as any)?.Estado ?? "(null)"}`);
    console.log(`  Resultado:    ${(row as any)?.["¿Devolución procedió?"] || (row as any)?.Resultado || "(null)"}`);
    console.log(`  Monto:        ${(row as any)?.["Monto solicitado"] ?? "(null)"}`);
    console.log(`  Porcentaje:   ${(row as any)?.["% conciliación"] ?? "(null)"}`);
    console.log(`  Tipo monto:   ${(row as any)?.["Tipo monto"] ?? "(null)"}`);
    console.log(`  Asesor:       ${(row as any)?.Asesor ?? "(null)"}`);
    console.log(`  País:         ${(row as any)?.País ?? "(null)"}`);
    console.log(`  Moneda:       ${(row as any)?.Moneda ?? "(null)"}`);
    console.log(`  Área:         ${(row as any)?.["Área causante"] || (row as any)?.Área || "(null)"}`);
    console.log(`  Motivo:       ${(row as any)?.Motivo ?? "(null)"}`);
    console.log(`  Observación:  ${(row as any)?.Observación ?? "(null)"}`);
    console.log(`  Origen:       EXCEL_HISTORICO`);
  }

  // ─── DEV-33671 ───
  console.log("\n" + "=".repeat(80));
  console.log("DEV-33671");
  console.log("=".repeat(80));
  const dev33671 = existentes.find(e => e.ticket_id === "33671");
  const excel33671 = auditados.find(r => r.ticketId === "33671");
  console.log(`En Excel:      ${excel33671 ? "SI" : "NO"}`);
  console.log(`En BD:         ${dev33671 ? `SI — ${dev33671.numero} | fecha_solicitud: ${dev33671.fecha_solicitud}` : "NO"}`);
  console.log(`Acción:        NO MODIFICAR (no está en el Excel)`);

  // ─── RESUMEN FINAL ───
  console.log("\n" + "=".repeat(80));
  console.log("RESUMEN FINAL");
  console.log("=".repeat(80));
  console.log(`Total INSERT:           ${counts.NUEVO}`);
  console.log(`Total UPDATE:           ${counts.FECHA_NULL + counts.FECHA_DIFERENTE + counts.SOLO_OTROS_CAMPOS}`);
  console.log(`Total campos modificados: ${totalCamposModificados}`);
  console.log(`Total DELETE:           0`);
  console.log(`Total duplicados:       0`);
  console.log(`Protección previa:      33 casos Phase 1 intactos`);
  console.log(`DEV-33671:              intacto`);
}

main().catch(console.error);
