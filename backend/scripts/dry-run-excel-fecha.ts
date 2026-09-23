/**
 * DRY RUN: Importación de casos QyD desde Excel histórico
 *
 * Lee el Excel Quejas_Devoluciones_2026-09-08 (1).xlsx y compara contra
 * la base de datos actual. Clasifica cada registro y muestra qué se haría
 * sin ejecutar ningún INSERT/UPDATE.
 *
 * Uso: npx tsx scripts/dry-run-excel-fecha.ts
 */
import { prisma } from "../src/repositories/prisma";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

interface ExcelRow {
  Fecha: string;
  "ID ticket": string;
  Caso: string;
  Dominio: string;
  País: string;
  // Devoluciones
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
  // Quejas
  "Tipo de queja"?: string;
  Área?: string;
  Producto?: string;
  Resultado?: string;
}

interface CasoExistente {
  id: string;
  ticket_id: string;
  numero: string;
  tipo: string;
  fecha_solicitud: string | null;
  estado: string | null;
  resultado: string | null;
  monto_pagado: number | null;
  monto_devuelto: number | null;
  porcentaje: number | null;
  tipo_monto: string | null;
  asesor: string | null;
  dominio: string | null;
  origen: string;
}

interface RegistroClasificado {
  sheet: string;
  ticketId: string;
  casoNumero: string;
  tipo: "devolucion" | "queja";
  dominio: string | null;
  fechaExcel: string;
  estadoExcel: string | null;
  resultadoExcel: string | null;
  montoExcel: number | null;
  porcentajeExcel: number | null;
  tipoMontoExcel: string | null;
  asesorExcel: string | null;
  // DB state
  existeEnBD: boolean;
  casoId: string | null;
  fechaSolicitudActual: string | null;
  // Actions
  accion: "CREAR" | "ACTUALIZAR_FECHA" | "ACTUALIZAR_CAMPOS" | "SIN_CAMBIOS" | "DUPLICADO_TIPO";
  camposAActualizar: string[];
}

function findExcelFile(): string {
  const candidates = [
    path.join("C:\\Users\\acast\\Downloads", "Quejas_Devoluciones_2026-09-08 (1).xlsx"),
    path.join("C:\\Users\\acast\\OneDrive\\Downloads", "Quejas_Devoluciones_2026-09-08 (1).xlsx"),
    path.join("C:\\Users\\acast\\Downloads", "Quejas_Devoluciones_2026-09-08.xlsx"),
    path.join("C:\\Users\\acast\\OneDrive\\Downloads", "Quejas_Devoluciones_2026-09-08.xlsx"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Excel file not found in Downloads");
}

function parseExcel(filePath: string): ExcelRow[] {
  const wb = XLSX.readFile(filePath);
  const allRows: ExcelRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);
    for (const row of data) {
      allRows.push({ ...row, _sheet: sheetName } as ExcelRow & { _sheet: string });
    }
  }
  return allRows;
}

function extractTipo(caso: string): "devolucion" | "queja" {
  if (caso.toUpperCase().startsWith("DEV")) return "devolucion";
  return "queja";
}

function extractTicketId(caso: string): string {
  // caso = "DEV-30843" → ticketId = "30843"
  const parts = caso.split("-");
  return parts[1] || "";
}

function normalizeFecha(fecha: string | undefined): string | null {
  if (!fecha) return null;
  // Excel dates might be serial numbers or strings
  if (typeof fecha === "number") {
    // Convert Excel serial date to ISO
    const d = new Date((fecha - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }
  const s = String(fecha).trim();
  if (!s) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try parsing
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

async function main() {
  console.log("=== DRY RUN: Importación de casos QyD desde Excel histórico ===\n");

  // 1. Find and read Excel
  const excelPath = findExcelFile();
  console.log("Excel:", excelPath);
  const rows = parseExcel(excelPath);
  console.log("Total registros leídos:", rows.length);

  // 2. Load all existing cases from DB
  const existentes = await prisma.$queryRaw<CasoExistente[]>`
    SELECT id, ticket_id, numero, tipo, fecha_solicitud, estado, resultado,
           monto_pagado, monto_devuelto, porcentaje, tipo_monto, asesor,
           dominio, origen
    FROM qd_casos
    WHERE eliminado = FALSE
  `;
  const existentesMap = new Map<string, CasoExistente>();
  for (const e of existentes) {
    existentesMap.set(`${e.ticket_id}:${e.tipo}`, e);
  }
  console.log("Casos existentes en BD:", existentes.length);

  // 3. Classify each Excel row
  const clasificados: RegistroClasificado[] = [];
  let crearCount = 0;
  let actualizarFechaCount = 0;
  let actualizarCamposCount = 0;
  let sinCambiosCount = 0;
  let duplicadoTipoCount = 0;
  let sinFechaExcelCount = 0;
  let fechasRecuperadasCount = 0;

  for (const row of rows) {
    const caso = (row as any).Caso || "";
    const ticketIdFromCaso = extractTicketId(caso);
    const ticketIdFromExcel = String(row["ID ticket"] || "").trim();
    const ticketId = ticketIdFromExcel || ticketIdFromCaso;
    const tipo = extractTipo(caso);
    const fechaExcel = normalizeFecha(String(row.Fecha || ""));
    const estadoExcel = row.Estado || null;
    const resultadoExcel = row["¿Devolución procedió?"] || row.Resultado || null;
    const montoExcel = row["Monto solicitado"] ?? null;
    const porcentajeExcel = row["% conciliación"] ?? null;
    const tipoMontoExcel = row["Tipo monto"] || null;
    const asesorExcel = row.Asesor || null;
    const dominioExcel = row.Dominio || null;
    const sheet = (row as any)._sheet || "";

    if (!fechaExcel) sinFechaExcelCount++;

    const clave = `${ticketId}:${tipo}`;
    const existente = existentesMap.get(clave);

    let accion: RegistroClasificado["accion"];
    let camposAActualizar: string[] = [];

    if (existente) {
      // Case exists - check what needs updating
      const updates: string[] = [];

      // Always recover fecha_solicitud from Excel if available
      if (fechaExcel && !existente.fecha_solicitud) {
        updates.push(`fecha_solicitud: ${existente.fecha_solicitud} → ${fechaExcel}`);
        fechasRecuperadasCount++;
      }

      // Check other fields
      if (resultadoExcel && existente.resultado !== resultadoExcel) {
        updates.push(`resultado: ${existente.resultado} → ${resultadoExcel}`);
      }
      if (montoExcel && existente.monto_pagado !== montoExcel) {
        updates.push(`monto_pagado: ${existente.monto_pagado} → ${montoExcel}`);
      }
      if (porcentajeExcel && existente.porcentaje !== porcentajeExcel) {
        updates.push(`porcentaje: ${existente.porcentaje} → ${porcentajeExcel}`);
      }
      if (tipoMontoExcel && existente.tipo_monto !== tipoMontoExcel) {
        updates.push(`tipo_monto: ${existente.tipo_monto} → ${tipoMontoExcel}`);
      }
      if (asesorExcel && existente.asesor !== asesorExcel) {
        updates.push(`asesor: ${existente.asesor} → ${asesorExcel}`);
      }
      if (estadoExcel && existente.estado !== estadoExcel) {
        updates.push(`estado: ${existente.estado} → ${estadoExcel}`);
      }

      if (updates.length === 0) {
        accion = "SIN_CAMBIOS";
        sinCambiosCount++;
      } else if (updates.length === 1 && updates[0].startsWith("fecha_solicitud")) {
        accion = "ACTUALIZAR_FECHA";
        actualizarFechaCount++;
        camposAActualizar = updates;
      } else {
        accion = "ACTUALIZAR_CAMPOS";
        actualizarCamposCount++;
        camposAActualizar = updates;
      }
    } else {
      // Case doesn't exist - will create
      accion = "CREAR";
      crearCount++;
      if (fechaExcel) fechasRecuperadasCount++;
    }

    clasificados.push({
      sheet,
      ticketId,
      casoNumero: caso,
      tipo,
      dominio: dominioExcel,
      fechaExcel: fechaExcel || "(sin fecha)",
      estadoExcel,
      resultadoExcel,
      montoExcel,
      porcentajeExcel,
      tipoMontoExcel,
      asesorExcel,
      existeEnBD: !!existente,
      casoId: existente?.id ?? null,
      fechaSolicitudActual: existente?.fecha_solicitud ?? null,
      accion,
      camposAActualizar,
    });
  }

  // 4. Print results
  console.log("\n=== RESUMEN DRY RUN ===");
  console.log(`Total registros Excel: ${rows.length}`);
  console.log(`Casos existentes en BD: ${existentes.length}`);
  console.log(`Casos a CREAR: ${crearCount}`);
  console.log(`Casos a ACTUALIZAR (solo fecha): ${actualizarFechaCount}`);
  console.log(`Casos a ACTUALIZAR (otros campos): ${actualizarCamposCount}`);
  console.log(`Casos SIN CAMBIOS: ${sinCambiosCount}`);
  console.log(`Fechas a recuperar: ${fechasRecuperadasCount}`);
  console.log(`Registros sin fecha en Excel: ${sinFechaExcelCount}`);

  // 5. Print details by action
  console.log("\n=== CASOS A CREAR ===");
  const aCrear = clasificados.filter(c => c.accion === "CREAR");
  if (aCrear.length === 0) {
    console.log("(ninguno)");
  } else {
    for (const c of aCrear) {
      console.log(`  ${c.casoNumero} | ticket ${c.ticketId} | tipo ${c.tipo} | dominio ${c.dominio} | fecha ${c.fechaExcel} | estado ${c.estadoExcel}`);
    }
  }

  console.log("\n=== CASOS CON FECHA A RECUPERAR ===");
  const aFecha = clasificados.filter(c => c.accion === "ACTUALIZAR_FECHA");
  if (aFecha.length === 0) {
    console.log("(ninguno)");
  } else {
    for (const c of aFecha) {
      console.log(`  ${c.casoNumero} | ticket ${c.ticketId} | fecha_actual: ${c.fechaSolicitudActual} → fecha_nueva: ${c.fechaExcel}`);
    }
  }

  console.log("\n=== CASOS CON OTROS CAMPOS A ACTUALIZAR ===");
  const aCampos = clasificados.filter(c => c.accion === "ACTUALIZAR_CAMPOS");
  if (aCampos.length === 0) {
    console.log("(ninguno)");
  } else {
    for (const c of aCampos) {
      console.log(`  ${c.casoNumero} | ticket ${c.ticketId}:`);
      for (const u of c.camposAActualizar) {
        console.log(`    - ${u}`);
      }
    }
  }

  console.log("\n=== CASOS SIN CAMBIOS ===");
  const sinCambios = clasificados.filter(c => c.accion === "SIN_CAMBIOS");
  if (sinCambios.length === 0) {
    console.log("(ninguno)");
  } else {
    for (const c of sinCambios) {
      console.log(`  ${c.casoNumero} | ticket ${c.ticketId} | fecha_actual: ${c.fechaSolicitudActual}`);
    }
  }

  // 6. Print all 53 cases with their classification
  console.log("\n=== MATRIZ COMPLETA (53 registros) ===");
  console.log("Caso | Ticket | Tipo | Dominio | Fecha Excel | Estado | Acción");
  console.log("-".repeat(100));
  for (const c of clasificados) {
    console.log(`${c.casoNumero} | ${c.ticketId} | ${c.tipo} | ${c.dominio ?? "(null)"} | ${c.fechaExcel} | ${c.estadoExcel ?? "(null)"} | ${c.accion}`);
  }

  // 7. Check for the 6 specific missing cases
  console.log("\n=== VERIFICACIÓN: 6 CASOS FALTANTES ===");
  const missing = ["30092", "30443", "30602", "30843", "31269", "32281"];
  for (const t of missing) {
    const found = clasificados.find(c => c.ticketId === t);
    if (found) {
      console.log(`  ${t}: ${found.casoNumero} | ${found.tipo} | fecha: ${found.fechaExcel} | acción: ${found.accion}`);
    } else {
      console.log(`  ${t}: NO ENCONTRADO EN EXCEL`);
    }
  }

  // 8. Check DEV-33671
  console.log("\n=== VERIFICACIÓN: DEV-33671 ===");
  const dev33671 = clasificados.find(c => c.ticketId === "33671");
  if (dev33671) {
    console.log(`  33671: ${dev33671.casoNumero} | ${dev33671.tipo} | fecha: ${dev33671.fechaExcel} | acción: ${dev33671.accion}`);
  } else {
    console.log(`  33671: NO ENCONTRADO EN EXCEL`);
    const existente33671 = existentesMap.get("33671:devolucion");
    if (existente33671) {
      console.log(`  Existe en BD: ${existente33671.numero} | fecha_solicitud: ${existente33671.fecha_solicitud}`);
    }
  }

  console.log("\n=== FIN DRY RUN ===");
  console.log("NO SE EJECUTARON CAMBIOS EN LA BASE DE DATOS.");
}

main().catch(console.error);
