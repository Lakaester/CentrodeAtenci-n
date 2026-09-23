import { prisma } from "../src/repositories/prisma";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

function findExcelFile(): string {
  const candidates = [
    path.join("C:\\Users\\acast\\Downloads", "Quejas_Devoluciones_2026-09-08 (2).xlsx"),
    path.join("C:\\Users\\acast\\OneDrive\\Escritorio", "Quejas_Devoluciones_2026-09-08 (2).xlsx"),
    path.join("C:\\Users\\acast\\OneDrive\\Downloads", "Quejas_Devoluciones_2026-09-08 (2).xlsx"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Excel file not found");
}

function extractTipo(caso: string): "devolucion" | "queja" {
  return caso.toUpperCase().startsWith("DEV") ? "devolucion" : "queja";
}

async function main() {
  console.log("=== AUDITORÍA COMPLETA: Excel (2) vs BD ===\n");

  const excelPath = findExcelFile();
  console.log("Excel:", excelPath);
  const wb = XLSX.readFile(excelPath);
  
  // Parse all sheets
  const excelMap = new Map<string, any>();
  let totalExcel = 0;
  for (const name of wb.SheetNames) {
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets[name]);
    console.log(`Hoja "${name}": ${data.length} registros`);
    totalExcel += data.length;
    for (const row of data) {
      const ticket = String(row["ID ticket"] || "").trim();
      const caso = row.Caso || "";
      const tipo = extractTipo(caso);
      excelMap.set(`${ticket}:${tipo}`, {
        caso,
        ticket,
        tipo,
        fecha: row.Fecha,
        estadoExcel: row.Estado || null,
        resultadoExcel: row["¿Devolución procedió?"] || row.Resultado || null,
        dominio: row.Dominio || null,
        pais: row.País || null,
        monto: row["Monto solicitado"] ?? null,
        moneda: row.Moneda || null,
        tipoMonto: row["Tipo monto"] || null,
        area: row["Área causante"] || row.Área || null,
        motivo: row.Motivo || null,
        porcentaje: row["% conciliación"] ?? null,
        montoDevolver: row["Monto real a devolver"] ?? null,
        asesor: row.Asesor || null,
        observacion: row["Observación"] || null,
        clasificacion: row["Tipo de queja"] || null,
        producto: row.Producto || null,
      });
    }
  }
  console.log(`Total Excel: ${totalExcel}\n`);

  // Load all BD cases (active)
  const bdCases = await prisma.$queryRaw<any[]>`
    SELECT numero, ticket_id, tipo, estado, resultado, fecha_solicitud, origen,
           dominio, pais, monto_pagado, monto_devuelto, porcentaje, tipo_monto,
           asesor, area, motivo, observacion, clasificacion, producto, moneda
    FROM qd_casos WHERE eliminado = FALSE ORDER BY numero
  `;
  console.log(`Total BD activos: ${bdCases.length}\n`);

  // ─── ESTADOS RESUMEN ───
  const estadoCounts: Record<string, number> = {};
  for (const c of bdCases) {
    estadoCounts[c.estado] = (estadoCounts[c.estado] || 0) + 1;
  }
  console.log("=== ESTADOS EN BD ===");
  for (const [k, v] of Object.entries(estadoCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // ─── CASOS NO EN EXCEL ───
  const noEnExcel: any[] = [];
  const enExcel: any[] = [];
  for (const bd of bdCases) {
    const key = `${bd.ticket_id}:${bd.tipo}`;
    if (excelMap.has(key)) {
      enExcel.push(bd);
    } else {
      noEnExcel.push(bd);
    }
  }
  
  console.log(`\n=== CASOS EN BD QUE NO ESTÁN EN EXCEL (2): ${noEnExcel.length} ===`);
  for (const c of noEnExcel) {
    console.log(`  ${c.numero} | ticket ${c.ticket_id} | ${c.estado} | ${c.resultado || '(null)'} | ${c.origen}`);
  }

  // ─── COMPARACIÓN DETALLADA ───
  console.log("\n=== COMPARACIÓN ESTADO/RESULTADO: Excel vs BD ===");
  let diffs = 0;
  let coincide = 0;
  const diferencias: any[] = [];

  for (const bd of enExcel) {
    const key = `${bd.ticket_id}:${bd.tipo}`;
    const ex = excelMap.get(key)!;
    
    const estadoMatch = bd.estado === ex.estadoExcel;
    const resultadoBD = bd.resultado || "(null)";
    const resultadoExcel = ex.resultadoExcel || "(null)";
    const resultadoMatch = resultadoBD === resultadoExcel;
    
    if (estadoMatch && resultadoMatch) {
      coincide++;
    } else {
      diffs++;
      diferencias.push({
        numero: bd.numero,
        ticket_id: bd.ticket_id,
        tipo: bd.tipo,
        estadoBD: bd.estado,
        estadoExcel: ex.estadoExcel,
        resultadoBD,
        resultadoExcel,
        origen: bd.origen,
      });
    }
  }

  console.log(`  Coinciden: ${coincide}`);
  console.log(`  Diferentes: ${diffs}`);

  if (diffs > 0) {
    console.log("\n=== DISCREPANCIAS DETALLADAS ===");
    for (const d of diferencias) {
      console.log(`\n  ${d.numero} | ticket ${d.ticket_id} | ${d.tipo} | origen: ${d.origen}`);
      if (d.estadoBD !== d.estadoExcel) {
        console.log(`    Estado: BD="${d.estadoBD}" → Excel="${d.estadoExcel}"`);
      }
      if (d.resultadoBD !== d.resultadoExcel) {
        console.log(`    Resultado: BD="${d.resultadoBD}" → Excel="${d.resultadoExcel}"`);
      }
    }
  }

  // ─── VERIFICAR: Todos los 53 del Excel están en BD? ───
  console.log("\n=== VERIFICACIÓN: Los 53 del Excel existen en BD? ===");
  let faltantes = 0;
  for (const [key, ex] of excelMap) {
    const bd = bdCases.find(b => `${b.ticket_id}:${b.tipo}` === key);
    if (!bd) {
      faltantes++;
      console.log(`  FALTA: ${ex.caso} | ticket ${ex.ticket} | tipo ${ex.tipo}`);
    }
  }
  if (faltantes === 0) console.log("  Todos los 53 casos del Excel existen en BD ✓");

  // ─── RESUMEN ───
  console.log("\n=== RESUMEN ===");
  console.log(`Excel total: ${totalExcel}`);
  console.log(`BD activos: ${bdCases.length}`);
  console.log(`En Excel + BD: ${enExcel.length}`);
  console.log(`Solo en BD (no en Excel): ${noEnExcel.length}`);
  console.log(`Solo en Excel (faltantes): ${faltantes}`);
  console.log(`Coinciden estado+resultado: ${coincide}`);
  console.log(`Discrepancias: ${diffs}`);
}

main().catch(console.error);
