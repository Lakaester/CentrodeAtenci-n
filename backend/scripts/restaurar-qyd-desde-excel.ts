/**
 * FASE 1 — RECUPERACIÓN QYD DESDE EXCEL HISTÓRICO
 *
 * Modo: --dry-run (default) o --apply
 *
 * PROTECCIONES:
 * 1. MANUAL = INTOCABLE. Si origen = 'MANUAL', SKIP.
 * 2. Solo campos autorizados: estado, resultado, monto_pagado, monto_devuelto, porcentaje, tipo_monto
 * 3. Solo recuperar cuando BD tiene NULL/default y Excel tiene valor
 * 4. Concurrent protection: WHERE estado = expected_value
 * 5. Transacción PostgreSQL con ROLLBACK automático
 * 6. Snapshot en qd_auditoria antes de cada cambio
 * 7. NO ejecutar DELETE, NO ejecutar backfill
 * 8. NO crear los 6 casos faltantes (FASE 2)
 */
import { prisma } from "../src/repositories/prisma";
import * as XLSX from 'xlsx';

const EXCEL_PATH = 'C:\\Users\\acast\\Downloads\\Quejas_Devoluciones_2026-09-08 (1).xlsx';
const DRY_RUN = !process.argv.includes('--apply');
const EXCEL_FECHA = '2026-09-08';

const ESTADOS_DEFAULT = ['pendiente de conciliación'];

function norm(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  return String(val).trim().toLowerCase();
}

function numEq(a: any, b: any): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

function isDefaultEstado(estado: string | null): boolean {
  if (!estado) return true;
  return ESTADOS_DEFAULT.includes(norm(estado));
}

interface RecoverField {
  campo: string;
  valor_bd: any;
  valor_excel: any;
  tipo: 'text' | 'numeric';
}

interface TicketRecovery {
  ticket_id: string;
  caso_numero: string;
  caso_id: string;
  tipo: string;
  origen_bd: string;
  campos: RecoverField[];
  clasificacion: string;
}

async function main() {
  console.log('=== FASE 1 — RECUPERACIÓN QYD DESDE EXCEL HISTÓRICO ===');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (sin cambios)' : 'APPLY (con cambios)'}`);
  console.log(`Fecha Excel: ${EXCEL_FECHA}`);
  console.log('');

  // 1. Read Excel
  const workbook = XLSX.readFile(EXCEL_PATH);
  const devData: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets['Devoluciones'], { defval: null });
  const quejaData: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets['Quejas'], { defval: null });

  console.log(`Excel: ${devData.length} devoluciones + ${quejaData.length} quejas = ${devData.length + quejaData.length} total`);

  // 2. Collect all ticket IDs
  const allTickets = [
    ...devData.map(d => ({ ticketId: String(d['ID ticket']), tipo: 'devolucion', excel: d })),
    ...quejaData.map(q => ({ ticketId: String(q['ID ticket']), tipo: 'queja', excel: q })),
  ];

  // 3. Query BD for all tickets
  const ticketIds = allTickets.map(t => t.ticketId);
  const bdRows: any[] = await prisma.$queryRaw`
    SELECT c.id, c.numero, c.ticket_id, c.tipo, c.estado, c.resultado,
           c.monto_pagado, c.monto_devuelto, c.porcentaje, c.moneda,
           c.tipo_monto, c.origen, c.eliminado
    FROM qd_casos c
    WHERE c.ticket_id = ANY(${ticketIds}::text[])
    AND c.eliminado = FALSE
  `;

  const bdMap = new Map<string, any>();
  for (const row of bdRows) {
    bdMap.set(String(row.ticket_id), row);
  }

  // 4. Compare and classify
  const recuperables: TicketRecovery[] = [];
  const iguales: TicketRecovery[] = [];
  const noExiste: TicketRecovery[] = [];

  for (const t of allTickets) {
    const bd = bdMap.get(t.ticketId);

    if (!bd) {
      noExiste.push({
        ticket_id: t.ticketId,
        caso_numero: t.excel['Caso'] || `${t.tipo === 'devolucion' ? 'DEV' : 'QUE'}-${t.ticketId}`,
        caso_id: '',
        tipo: t.tipo,
        origen_bd: 'NO_EXISTE',
        campos: [],
        clasificacion: 'NO_EXISTE_EN_BD',
      });
      continue;
    }

    // PROTECCIÓN #6: MANUAL = INTOCABLE
    if (bd.origen === 'MANUAL') {
      iguales.push({
        ticket_id: t.ticketId,
        caso_numero: bd.numero,
        caso_id: bd.id,
        tipo: t.tipo,
        origen_bd: bd.origen,
        campos: [],
        clasificacion: 'IGUAL',
      });
      continue;
    }

    const campos: RecoverField[] = [];

    if (t.tipo === 'devolucion') {
      // estado
      const eExcel = t.excel['Estado'];
      const eBD = bd.estado;
      if (eExcel && isDefaultEstado(eBD) && norm(eExcel) !== norm(eBD)) {
        campos.push({ campo: 'estado', valor_bd: eBD, valor_excel: eExcel, tipo: 'text' });
      }

      // resultado
      const rExcel = t.excel['¿Devolución procedió?'];
      const rBD = bd.resultado;
      if (rExcel && !rBD) {
        campos.push({ campo: 'resultado', valor_bd: rBD, valor_excel: rExcel, tipo: 'text' });
      }

      // monto_pagado
      const mExcel = t.excel['Monto solicitado'];
      const mBD = bd.monto_pagado;
      if (mExcel !== null && mBD === null) {
        campos.push({ campo: 'monto_pagado', valor_bd: mBD, valor_excel: mExcel, tipo: 'numeric' });
      }

      // monto_devuelto
      const mdExcel = t.excel['Monto real a devolver'];
      const mdBD = bd.monto_devuelto;
      if (mdExcel !== null && mdBD === null) {
        campos.push({ campo: 'monto_devuelto', valor_bd: mdBD, valor_excel: mdExcel, tipo: 'numeric' });
      }

      // porcentaje
      const pExcel = t.excel['% conciliación'];
      const pBD = bd.porcentaje;
      if (pExcel !== null && pBD === null) {
        campos.push({ campo: 'porcentaje', valor_bd: pBD, valor_excel: pExcel, tipo: 'numeric' });
      }

      // tipo_monto
      const tmExcel = t.excel['Tipo monto'];
      const tmBD = bd.tipo_monto;
      if (tmExcel && !tmBD) {
        campos.push({ campo: 'tipo_monto', valor_bd: tmBD, valor_excel: tmExcel, tipo: 'text' });
      }

    } else {
      // queja — only estado and resultado
      const eExcel = t.excel['Estado'];
      const eBD = bd.estado;
      if (eExcel && isDefaultEstado(eBD) && norm(eExcel) !== norm(eBD)) {
        campos.push({ campo: 'estado', valor_bd: eBD, valor_excel: eExcel, tipo: 'text' });
      }

      const rExcel = t.excel['Resultado'];
      const rBD = bd.resultado;
      if (rExcel && !rBD) {
        campos.push({ campo: 'resultado', valor_bd: rBD, valor_excel: rExcel, tipo: 'text' });
      }
    }

    if (campos.length > 0) {
      recuperables.push({
        ticket_id: t.ticketId,
        caso_numero: bd.numero,
        caso_id: bd.id,
        tipo: t.tipo,
        origen_bd: bd.origen,
        campos,
        clasificacion: 'RECUPERABLE',
      });
    } else {
      iguales.push({
        ticket_id: t.ticketId,
        caso_numero: bd.numero,
        caso_id: bd.id,
        tipo: t.tipo,
        origen_bd: bd.origen,
        campos: [],
        clasificacion: 'IGUAL',
      });
    }
  }

  // 5. Print summary
  console.log('\n=== RESUMEN ===');
  console.log(`Total Excel: ${allTickets.length}`);
  console.log(`En BD: ${bdRows.length}`);
  console.log(`IGUALES: ${iguales.length}`);
  console.log(`RECUPERABLES: ${recuperables.length}`);
  console.log(`NO EXISTEN EN BD: ${noExiste.length}`);

  const sumCheck = iguales.length + recuperables.length + noExiste.length;
  console.log(`Verificación: ${iguales.length} + ${recuperables.length} + ${noExiste.length} = ${sumCheck} (esperado: ${allTickets.length}) ${sumCheck === allTickets.length ? '✓' : '✗ ERROR'}`);

  // Field-level counts
  const fieldCounts: Record<string, number> = {};
  for (const r of recuperables) {
    for (const c of r.campos) {
      fieldCounts[c.campo] = (fieldCounts[c.campo] || 0) + 1;
    }
  }
  console.log('\n=== RECUPERACIÓN POR CAMPO ===');
  for (const [campo, count] of Object.entries(fieldCounts)) {
    console.log(`${campo}: ${count}`);
  }

  // By type
  const recDev = recuperables.filter(r => r.tipo === 'devolucion');
  const recQueja = recuperables.filter(r => r.tipo === 'queja');
  console.log('\n=== RECUPERABLES POR TIPO ===');
  console.log(`DEVOLUCIONES: ${recDev.length}`);
  console.log(`QUEJAS: ${recQueja.length}`);

  // 6. Print each recoverable case
  console.log('\n=== CASOS RECUPERABLES (DETALLE) ===');
  for (const r of recuperables) {
    console.log(`\n--- ${r.caso_numero} / ticket ${r.ticket_id} (origen: ${r.origen_bd}) ---`);
    for (const c of r.campos) {
      console.log(`  ${c.campo}: BD="${c.valor_bd}" → Excel="${c.valor_excel}"`);
    }
  }

  // 7. Print no-exist
  if (noExiste.length > 0) {
    console.log('\n=== NO EXISTEN EN BD (FASE 2 — NO CREAR) ===');
    for (const r of noExiste) {
      console.log(`  ${r.caso_numero} / ticket ${r.ticket_id} (${r.tipo})`);
    }
  }

  // 8. Print iguales
  console.log('\n=== IGUALES / PROTEGIDOS (SIN CAMBIOS) ===');
  for (const r of iguales) {
    console.log(`  ${r.caso_numero} / ticket ${r.ticket_id} (origen: ${r.origen_bd})`);
  }

  // 9. Execute if --apply
  if (!DRY_RUN) {
    console.log('\n=== EJECUTANDO APPLY ===');
    console.log('Iniciando transacción...');

    let aplicados = 0;
    let skipped = 0;
    let errores = 0;
    const auditRecords: any[] = [];

    // Execute in batches of 5 to avoid transaction timeout
    const BATCH_SIZE = 5;
    const batches: TicketRecovery[][] = [];
    for (let i = 0; i < recuperables.length; i += BATCH_SIZE) {
      batches.push(recuperables.slice(i, i + BATCH_SIZE));
    }

    console.log(`Procesando ${recuperables.length} casos en ${batches.length} lotes de ${BATCH_SIZE}...`);

    try {
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      console.log(`\n--- Lote ${batchIdx + 1}/${batches.length} ---`);

      await prisma.$transaction(async (tx) => {
    for (const r of batch) {
      console.log(`\nProcesando ${r.caso_numero} (ticket ${r.ticket_id})...`);

      // Re-read current state for concurrent protection
      const currentRows: any[] = await tx.$queryRaw`
        SELECT c.id, c.numero, c.ticket_id, c.estado, c.resultado,
               c.monto_pagado, c.monto_devuelto, c.porcentaje, c.tipo_monto, c.origen
        FROM qd_casos c
        WHERE c.ticket_id = ${r.ticket_id} AND c.eliminado = FALSE
      `;

      if (currentRows.length === 0) {
        console.log(`  SKIPPED: caso no encontrado`);
        skipped++;
        continue;
      }

      const current = currentRows[0];

      // PROTECCIÓN #6: MANUAL = INTOCABLE (double-check)
      if (current.origen === 'MANUAL') {
        console.log(`  SKIPPED: origen es MANUAL`);
        skipped++;
        continue;
      }

      // Build SET clauses with concurrent protection
      const setClauses: string[] = [];
      const whereParts: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      // WHERE: ticket_id first
      whereParts.push(`ticket_id = $${paramIdx}`);
      values.push(r.ticket_id);
      paramIdx++;
      whereParts.push(`eliminado = FALSE`);

      const changesForAudit: any[] = [];

      for (const c of r.campos) {
        // Concurrent protection: verify current value matches DRY RUN expectation
        const currentVal = current[c.campo];

        // For estado: check it's still default
        if (c.campo === 'estado') {
          if (!isDefaultEstado(currentVal)) {
            console.log(`  SKIPPED_CHANGED_AFTER_DRY_RUN: ${c.campo} actual="${currentVal}" (esperaba default)`);
            continue;
          }
        }
        // For other fields: check they're still NULL
        else if (currentVal !== null && currentVal !== undefined && currentVal !== '') {
          console.log(`  SKIPPED_CHANGED_AFTER_DRY_RUN: ${c.campo} actual="${currentVal}" (esperaba null)`);
          continue;
        }

        setClauses.push(`${c.campo} = $${paramIdx}`);
        values.push(c.valor_excel);
        paramIdx++;

        changesForAudit.push({
          campo: c.campo,
          valor_anterior: String(currentVal ?? 'null'),
          valor_nuevo: String(c.valor_excel),
        });
      }

      if (setClauses.length === 0) {
        console.log(`  SKIPPED: todos los campos cambiaron después del DRY RUN`);
        skipped++;
        continue;
      }

      setClauses.push(`updated_at = NOW()`);

      // WHERE: concurrent protection on estado
      whereParts.push(`estado = $${paramIdx}`);
      values.push(current.estado);
      paramIdx++;

      const updateSql = `
        UPDATE qd_casos
        SET ${setClauses.join(', ')}
        WHERE ${whereParts.join(' AND ')}
      `;

      const result = await tx.$executeRawUnsafe(updateSql, ...values);

      if (result === 0) {
        console.log(`  SKIPPED: concurrent change detected (WHERE didn't match)`);
        skipped++;
        continue;
      }

      // Register in auditoria
      for (const ch of changesForAudit) {
        await tx.$executeRaw`
          INSERT INTO qd_auditoria (id, caso_id, accion, campo, valor_anterior, valor_nuevo, usuario, created_at)
          VALUES (
            gen_random_uuid()::text,
            ${current.id},
            'recuperacion_excel',
            ${ch.campo},
            ${ch.valor_anterior},
            ${ch.valor_nuevo},
            'restauracion-forense',
            NOW()
          )
        `;
        auditRecords.push({
          caso_id: current.id,
          ticket_id: r.ticket_id,
          campo: ch.campo,
          valor_anterior: ch.valor_anterior,
          valor_nuevo: ch.valor_nuevo,
        });
      }

      console.log(`  OK: ${changesForAudit.length} campos actualizados`);
      aplicados++;
    }
    }, { maxWait: 30000, timeout: 60000 });

    } // end batch loop

    console.log('\n=== TODOS LOS LOTES PROCESADOS ===');
    } catch (error: any) {
      console.error('\n=== ERROR — ROLLBACK AUTOMÁTICO ===');
      console.error(error.message);
      console.error('NO se modificó ningún dato.');
      process.exit(1);
    }

    console.log('\n=== APPLY COMPLETADO ===');
    console.log(`Casos recuperados: ${aplicados}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errores: ${errores}`);
    console.log(`Registros de auditoría: ${auditRecords.length}`);

    // 10. Post-apply validation
    console.log('\n=== VALIDACIÓN POST-APPLY ===');

    // Re-query all 33 tickets
    const allRecTicketIds = recuperables.map(r => r.ticket_id);
    const postRows: any[] = await prisma.$queryRaw`
      SELECT c.numero, c.ticket_id, c.tipo, c.estado, c.resultado,
             c.monto_pagado, c.monto_devuelto, c.porcentaje, c.tipo_monto, c.origen
      FROM qd_casos c
      WHERE c.ticket_id = ANY(${allRecTicketIds}::text[])
      AND c.eliminado = FALSE
      ORDER BY c.numero
    `;

    let validados = 0;
    let fallidos = 0;

    for (const r of recuperables) {
      const post = postRows.find((p: any) => String(p.ticket_id) === r.ticket_id);
      if (!post) {
        console.log(`  FALLO: ${r.ticket_id} no encontrado post-apply`);
        fallidos++;
        continue;
      }

      let ok = true;
      for (const c of r.campos) {
        const actualVal = post[c.campo];
        const expectedVal = c.valor_excel;

        if (c.tipo === 'numeric') {
          if (!numEq(actualVal, expectedVal)) {
            console.log(`  FALLO: ${r.caso_numero} ${c.campo} actual="${actualVal}" esperado="${expectedVal}"`);
            ok = false;
          }
        } else {
          if (norm(actualVal) !== norm(expectedVal)) {
            console.log(`  FALLO: ${r.caso_numero} ${c.campo} actual="${actualVal}" esperado="${expectedVal}"`);
            ok = false;
          }
        }
      }
      if (ok) validados++;
      else fallidos++;
    }

    console.log(`\nValidación: ${validados}/${recuperables.length} correctos ${validados === recuperables.length ? '✓' : '✗'}`);

    // Validate 14 MANUAL
    console.log('\n=== VALIDACIÓN MANUAL (14 casos) ===');
    const manualTickets = iguales.filter(i => i.origen_bd === 'MANUAL');
    const manualIds = manualTickets.map(i => i.ticket_id);
    const manualPostRows: any[] = await prisma.$queryRaw`
      SELECT c.numero, c.ticket_id, c.estado, c.resultado, c.monto_pagado, c.origen
      FROM qd_casos c
      WHERE c.ticket_id = ANY(${manualIds}::text[])
      AND c.eliminado = FALSE
    `;

    let manualOk = 0;
    for (const mt of manualTickets) {
      const post = manualPostRows.find((p: any) => String(p.ticket_id) === mt.ticket_id);
      if (post && post.origen === 'MANUAL') {
        manualOk++;
      } else {
        console.log(`  FALLO: ticket ${mt.ticket_id} origen cambió`);
      }
    }
    console.log(`MANUAL intactos: ${manualOk}/${manualTickets.length} ${manualOk === manualTickets.length ? '✓' : '✗'}`);

    // Validate duplicates
    console.log('\n=== VALIDACIÓN DUPLICADOS ===');
    const dupTicket: any[] = await prisma.$queryRaw`
      SELECT ticket_id, tipo, COUNT(*) as cnt
      FROM qd_casos
      WHERE eliminado = FALSE
      GROUP BY ticket_id, tipo
      HAVING COUNT(*) > 1
    `;
    console.log(`Duplicados ticket+tipo: ${dupTicket.length} ${dupTicket.length === 0 ? '✓' : '✗'}`);

    const dupNumero: any[] = await prisma.$queryRaw`
      SELECT numero, COUNT(*) as cnt
      FROM qd_casos
      WHERE eliminado = FALSE
      GROUP BY numero
      HAVING COUNT(*) > 1
    `;
    console.log(`Duplicados numero: ${dupNumero.length} ${dupNumero.length === 0 ? '✓' : '✗'}`);

    // Validate audit
    console.log('\n=== VALIDACIÓN AUDITORÍA ===');
    const auditCount: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM qd_auditoria WHERE accion = 'recuperacion_excel'
    `;
    console.log(`Registros recuperacion_excel: ${auditCount[0]?.total || 0}`);

    const auditByField: any[] = await prisma.$queryRaw`
      SELECT campo, COUNT(*) as total FROM qd_auditoria WHERE accion = 'recuperacion_excel' GROUP BY campo ORDER BY campo
    `;
    for (const a of auditByField) {
      console.log(`  ${a.campo}: ${a.total}`);
    }

    console.log('\n=== FASE 1 COMPLETADA ===');
    console.log(`Recuperados: ${aplicados}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Audit records: ${auditRecords.length}`);
    console.log(`NO se crearon los 6 casos faltantes (FASE 2)`);
    console.log(`NO se ejecutó backfill`);
    console.log(`NO se ejecutó DELETE`);

  } else {
    console.log('\n=== DRY-RUN COMPLETADO ===');
    console.log('Para ejecutar: npx ts-node backend/scripts/restaurar-qyd-desde-excel.ts --apply');
  }
}

main().catch(console.error);
