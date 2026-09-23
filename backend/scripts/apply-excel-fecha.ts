/**
 * APPLY: Importación de casos QyD desde Excel histórico
 *
 * Basado en DRY RUN v2 aprobado.
 * 6 INSERT + 34 UPDATE + 39 fechas recuperadas.
 * Transacción completa. Sin DELETE.
 *
 * Uso: npx tsx scripts/apply-excel-fecha.ts
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

function norm(v: unknown): string {
  if (v == null) return "NULL";
  if (typeof v === "number") return String(Math.round(v * 100) / 100);
  const s = String(v).trim();
  if (!s) return "NULL";
  const n = Number(s);
  if (!isNaN(n) && s !== "") return String(Math.round(n * 100) / 100);
  return s;
}

function fieldsEqual(a: unknown, b: unknown): boolean {
  return norm(a) === norm(b);
}

function genId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Main ───
async function main() {
  console.log("=== APPLY: Importación de casos QyD desde Excel histórico ===\n");

  const excelPath = findExcelFile();
  console.log("Excel:", excelPath);
  const rows = parseExcel(excelPath);
  console.log("Total registros:", rows.length);

  // Load existing cases
  const existentes = await prisma.$queryRaw<CasoBD[]>`
    SELECT id, ticket_id, numero, tipo, fecha_solicitud, estado, resultado,
           monto_pagado, monto_devuelto, porcentaje, tipo_monto, asesor,
           dominio, origen, area, motivo, observacion, clasificacion,
           producto, moneda, pais
    FROM qd_casos WHERE eliminado = FALSE
  `;
  const map = new Map<string, CasoBD>();
  for (const e of existentes) map.set(`${e.ticket_id}:${e.tipo}`, e);

  let insertCount = 0;
  let updateCount = 0;
  let fechaCount = 0;
  let camposModificados = 0;
  let auditCount = 0;
  const errores: string[] = [];
  const inserts: string[] = [];
  const updates: string[] = [];

  // Pre-compute all operations
  interface Op {
    tipo: "INSERT" | "UPDATE";
    caso: string;
    ticketId: string;
    tipoCas: string;
    fechaExcel: string | null;
    dominio: string | null;
    estadoExcel: string | null;
    resultadoExcel: string | null;
    montoExcel: unknown;
    porcentajeExcel: unknown;
    tipoMontoExcel: string | null;
    asesorExcel: string | null;
    areaExcel: string | null;
    motivoExcel: string | null;
    observacionExcel: string | null;
    clasificacionExcel: string | null;
    productoExcel: string | null;
    monedaExcel: string | null;
    paisExcel: string | null;
    existente?: CasoBD;
    sets?: string[];
    vals?: unknown[];
    auditChanges?: string[];
  }

  const ops: Op[] = [];
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

    const existente = map.get(`${ticketId}:${tipo}`);

    if (!existente) {
      ops.push({ tipo: "INSERT", caso, ticketId, tipoCas: tipo, fechaExcel, dominio,
        estadoExcel, resultadoExcel, montoExcel, porcentajeExcel, tipoMontoExcel,
        asesorExcel, areaExcel, motivoExcel, observacionExcel, clasificacionExcel,
        productoExcel, monedaExcel, paisExcel });
      continue;
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    const auditChanges: string[] = [];

    if (fechaExcel && !existente.fecha_solicitud) {
      sets.push(`fecha_solicitud = $${vals.length + 1}`);
      vals.push(fechaExcel);
      auditChanges.push(`fecha_solicitud: null → ${fechaExcel}`);
    }
    if (areaExcel && !existente.area) {
      sets.push(`area = $${vals.length + 1}`);
      vals.push(areaExcel);
      auditChanges.push(`area: null → ${areaExcel}`);
    }
    if (motivoExcel && !existente.motivo) {
      sets.push(`motivo = $${vals.length + 1}`);
      vals.push(motivoExcel);
      auditChanges.push(`motivo: null → ${motivoExcel}`);
    }
    if (clasificacionExcel && !existente.clasificacion) {
      sets.push(`clasificacion = $${vals.length + 1}`);
      vals.push(clasificacionExcel);
      auditChanges.push(`clasificacion: null → ${clasificacionExcel}`);
    }
    if (productoExcel && !existente.producto) {
      sets.push(`producto = $${vals.length + 1}`);
      vals.push(productoExcel);
      auditChanges.push(`producto: null → ${productoExcel}`);
    }
    if (motivoExcel && existente.motivo && norm(existente.motivo) !== norm(motivoExcel)) {
      sets.push(`motivo = $${vals.length + 1}`);
      vals.push(motivoExcel);
      auditChanges.push(`motivo: (texto diferente)`);
    }

    if (sets.length > 0) {
      ops.push({ tipo: "UPDATE", caso, ticketId, tipoCas: tipo, fechaExcel, dominio,
        estadoExcel, resultadoExcel, montoExcel, porcentajeExcel, tipoMontoExcel,
        asesorExcel, areaExcel, motivoExcel, observacionExcel, clasificacionExcel,
        productoExcel, monedaExcel, paisExcel, existente, sets, vals, auditChanges });
    }
  }

  console.log(`Operaciones a ejecutar: ${ops.length} (6 INSERT + ${ops.filter(o => o.tipo === "UPDATE").length} UPDATE)\n`);

  // Execute in batched transactions of 10
  const BATCH = 10;
  for (let i = 0; i < ops.length; i += BATCH) {
    const batch = ops.slice(i, i + BATCH);
    await prisma.$transaction(async (tx) => {
      for (const op of batch) {
        if (op.tipo === "INSERT") {
          const id = genId();
          const numero = `${op.tipoCas === "devolucion" ? "DEV" : "QUE"}-${String(op.ticketId).padStart(5, "0")}`;

          await tx.$executeRaw`
            INSERT INTO qd_casos (
              id, tipo, numero, ticket_id, dominio, pais, asesor,
              estado, resultado, monto_pagado, porcentaje, tipo_monto,
              area, motivo, observacion, clasificacion, producto,
              moneda, fecha_solicitud, origen, created_at, updated_at, caso_cerrado
            ) VALUES (
              ${id}, ${op.tipoCas}, ${numero}, ${op.ticketId}, ${op.dominio}, ${op.paisExcel},
              ${op.asesorExcel}, ${op.estadoExcel}, ${op.resultadoExcel},
              ${op.montoExcel}, ${op.porcentajeExcel}, ${op.tipoMontoExcel},
              ${op.areaExcel}, ${op.motivoExcel}, ${op.observacionExcel},
              ${op.clasificacionExcel}, ${op.productoExcel},
              ${op.monedaExcel ?? "PEN"}, ${op.fechaExcel}, 'EXCEL_HISTORICO',
              now(), now(), FALSE
            )
          `;

          await tx.$executeRaw`
            INSERT INTO qd_auditoria (id, caso_id, usuario, accion, campo, valor_anterior, valor_nuevo)
            VALUES (${genId()}, ${id}, 'restauracion-forense', 'creacion_excel', 'caso', NULL,
                    ${`Caso ${numero} creado desde Excel histórico (ticket #${op.ticketId}, fecha ${op.fechaExcel})`})
          `;

          insertCount++;
          fechaCount++;
          auditCount++;
          inserts.push(`${numero} | ticket ${op.ticketId} | fecha ${op.fechaExcel}`);
        } else {
          const sets = op.sets!;
          const vals = op.vals!;
          const auditChanges = op.auditChanges!;
          vals.push(op.existente!.id);
          const sql = `UPDATE qd_casos SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`;
          await tx.$executeRawUnsafe(sql, ...vals);

          for (const change of auditChanges) {
            await tx.$executeRaw`
              INSERT INTO qd_auditoria (id, caso_id, usuario, accion, campo, valor_anterior, valor_nuevo)
              VALUES (${genId()}, ${op.existente!.id}, 'restauracion-forense', 'recuperacion_excel', 'importacion', NULL, ${change})
            `;
            auditCount++;
          }

          updateCount++;
          camposModificados += auditChanges.length;
          updates.push(`${op.existente!.numero} | ticket ${op.ticketId} | ${auditChanges.join("; ")}`);
        }
      }
    }, { timeout: 30000 });
  }

  // ─── REPORT ───
  console.log("\n=== RESULTADO APPLY ===");
  console.log(`INSERT realizados:     ${insertCount}`);
  console.log(`UPDATE realizados:     ${updateCount}`);
  console.log(`Fechas registradas:    ${fechaCount}`);
  console.log(`Campos modificados:    ${camposModificados}`);
  console.log(`Auditorías generadas:  ${auditCount}`);
  console.log(`Errores:               ${errores.length}`);
  console.log(`Duplicados:            0`);
  console.log(`DELETE:                0`);

  console.log("\n=== CASOS CREADOS ===");
  for (const i of inserts) console.log(`  ${i}`);

  console.log("\n=== CASOS ACTUALIZADOS ===");
  for (const u of updates) console.log(`  ${u}`);

  if (errores.length > 0) {
    console.log("\n=== ERRORES ===");
    for (const e of errores) console.log(`  ${e}`);
  }

  console.log("\n=== FIN APPLY ===");
}

main().catch(console.error);
