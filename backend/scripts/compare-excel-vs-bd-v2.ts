/**
 * DRY RUN DEFINITIVO — Recuperación QyD desde Excel Histórico
 *
 * REGLAS:
 * 1. MANUAL = PROTEGIDO. Nunca modificar aunque aparezca en Excel.
 * 2. BACKFILL con estado default + Excel con estado operativo → RECUPERABLE.
 * 3. BACKFILL con NULL + Excel con valor → RECUPERABLE.
 * 4. BD y Excel iguales → IGUAL.
 * 5. BD con valor no-default diferente al Excel → CONFLICTO.
 * 6. No existe en BD → NO_EXISTE_EN_BD.
 */
import * as XLSX from 'xlsx';

const EXCEL_PATH = 'C:\\Users\\acast\\Downloads\\Quejas_Devoluciones_2026-09-08 (1).xlsx';
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

function isDefault(estado: string | null): boolean {
  if (!estado) return true;
  return ESTADOS_DEFAULT.includes(norm(estado));
}

// Read Excel
const workbook = XLSX.readFile(EXCEL_PATH);
const devData: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets['Devoluciones'], { defval: null });
const quejaData: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets['Quejas'], { defval: null });

// BD data (from query - hardcoded from actual DB state)
const bdData: Record<string, any>[] = [
  { ticket_id: "5221", numero: "DEV-05221", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "5646", numero: "DEV-05646", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "8230", numero: "DEV-08230", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "8578", numero: "DEV-08578", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "24894", numero: "DEV-10729", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "423.72", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL" },
  { ticket_id: "30146", numero: "DEV-16270", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "490.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "USD", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "28297", numero: "DEV-16874", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "300.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL" },
  { ticket_id: "31559", numero: "DEV-31559", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31593", numero: "DEV-31593", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31795", numero: "DEV-31795", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32252", numero: "DEV-32252", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32273", numero: "DEV-32273", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32492", numero: "DEV-32492", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32584", numero: "DEV-32584", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "29523", numero: "DEV-32998", tipo: "devolucion", estado: "Resuelto", resultado: "Procede 100%", monto_pagado: "2055.00", monto_devuelto: "2055.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "33068", numero: "DEV-33068", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "28075", numero: "DEV-36067", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "2470.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "27919", numero: "DEV-45461", tipo: "devolucion", estado: "Resuelto", resultado: "Procede parcialmente", monto_pagado: "900.00", monto_devuelto: "299.97", porcentaje: "33.33", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "31753", numero: "DEV-52537", tipo: "devolucion", estado: "Resuelto", resultado: "Procede 100%", monto_pagado: "2565.00", monto_devuelto: "2565.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "21281", numero: "DEV-68078", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "1150.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "29937", numero: "DEV-68407", tipo: "devolucion", estado: "Pendiente de conciliación", resultado: "Pendiente", monto_pagado: "1270.00", monto_devuelto: "635.00", porcentaje: "50.00", moneda: "USD", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "29164", numero: "DEV-69171", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "2160.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "33352", numero: "DEV-75590", tipo: "devolucion", estado: "Pendiente de aprobación", resultado: "Pendiente", monto_pagado: "150.00", monto_devuelto: "150.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL" },
  { ticket_id: "23739", numero: "DEV-84497", tipo: "devolucion", estado: "Resuelto", resultado: "Procede 100%", monto_pagado: "308.00", monto_devuelto: "308.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL" },
  { ticket_id: "31550", numero: "DEV-92678", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "250.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL" },
  { ticket_id: "31460", numero: "DEV-27261", tipo: "devolucion", estado: "Resuelto", resultado: "No procede", monto_pagado: "1500.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL" },
  { ticket_id: "7709", numero: "QUE-07709", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "30544", numero: "QUE-30544", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "30651", numero: "QUE-30651", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "30713", numero: "QUE-30713", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "30890", numero: "QUE-30890", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31060", numero: "QUE-31060", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31415", numero: "QUE-31415", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31451", numero: "QUE-31451", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31509", numero: "QUE-31509", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31511", numero: "QUE-31511", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "31921", numero: "QUE-31921", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32027", numero: "QUE-32027", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32220", numero: "QUE-32220", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32406", numero: "QUE-32406", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32407", numero: "QUE-32407", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32638", numero: "QUE-32638", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32641", numero: "QUE-32641", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32644", numero: "QUE-32644", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "32682", numero: "QUE-32682", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "33055", numero: "QUE-33055", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
  { ticket_id: "33144", numero: "QUE-33144", tipo: "queja", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL" },
];

const bdMap = new Map<string, Record<string, any>>();
for (const row of bdData) bdMap.set(String(row.ticket_id), row);

interface Row {
  ticket_id: string;
  caso_excel: string;
  caso_bd: string;
  tipo: string;
  origen_bd: string;
  estado_bd: string;
  estado_excel: string;
  resultado_bd: string;
  resultado_excel: string;
  monto_pagado_bd: string | null;
  monto_pagado_excel: number | null;
  monto_devuelto_bd: string | null;
  monto_devuelto_excel: number | null;
  porcentaje_bd: string | null;
  porcentaje_excel: number | null;
  tipo_monto_bd: string | null;
  tipo_monto_excel: string;
  moneda_bd: string;
  moneda_excel: string;
  clasificacion: string;
  updates: string[];
}

const results: Row[] = [];

// Process Devoluciones
for (const d of devData) {
  const tid = String(d['ID ticket']);
  const bd = bdMap.get(tid);
  const casoExcel = d['Caso'] || '';

  if (!bd) {
    results.push({
      ticket_id: tid, caso_excel: casoExcel, caso_bd: 'NO EXISTE', tipo: 'devolucion',
      origen_bd: 'NO EXISTE', estado_bd: '', estado_excel: d['Estado'] || '',
      resultado_bd: '', resultado_excel: d['¿Devolución procedió?'] || '',
      monto_pagado_bd: null, monto_pagado_excel: d['Monto solicitado'],
      monto_devuelto_bd: null, monto_devuelto_excel: d['Monto real a devolver'],
      porcentaje_bd: null, porcentaje_excel: d['% conciliación'],
      tipo_monto_bd: '', tipo_monto_excel: d['Tipo monto'] || '',
      moneda_bd: '', moneda_excel: d['Moneda'] || '',
      clasificacion: 'NO_EXISTE_EN_BD', updates: [],
    });
    continue;
  }

  // MANUAL = PROTECTED
  if (bd.origen === 'MANUAL') {
    // Check if BD matches Excel exactly
    const eMatch = norm(bd.estado) === norm(d['Estado']);
    const rMatch = norm(bd.resultado) === norm(d['¿Devolución procedió?']);
    const mMatch = numEq(bd.monto_pagado, d['Monto solicitado']);
    const mdMatch = numEq(bd.monto_devuelto, d['Monto real a devolver']);
    const pMatch = numEq(bd.porcentaje, d['% conciliación']);
    const tmMatch = norm(bd.tipo_monto) === norm(d['Tipo monto']);

    const allMatch = eMatch && rMatch && mMatch && mdMatch && pMatch && tmMatch;

    results.push({
      ticket_id: tid, caso_excel: casoExcel, caso_bd: bd.numero, tipo: 'devolucion',
      origen_bd: bd.origen, estado_bd: bd.estado, estado_excel: d['Estado'] || '',
      resultado_bd: bd.resultado || '', resultado_excel: d['¿Devolución procedió?'] || '',
      monto_pagado_bd: bd.monto_pagado, monto_pagado_excel: d['Monto solicitado'],
      monto_devuelto_bd: bd.monto_devuelto, monto_devuelto_excel: d['Monto real a devolver'],
      porcentaje_bd: bd.porcentaje, porcentaje_excel: d['% conciliación'],
      tipo_monto_bd: bd.tipo_monto, tipo_monto_excel: d['Tipo monto'] || '',
      moneda_bd: bd.moneda, moneda_excel: d['Moneda'] || '',
      clasificacion: allMatch ? 'IGUAL' : 'CONFLICTO_MANUAL',
      updates: [],
    });
    continue;
  }

  // BACKFILL logic
  const updates: string[] = [];

  // estado
  let eExcel = d['Estado'] || '';
  let eBD = bd.estado;
  let eAction = '';
  if (isDefault(eBD) && eExcel && norm(eExcel) !== norm(eBD)) {
    eAction = `estado: "${eBD}" → "${eExcel}"`;
    updates.push(eAction);
  } else if (!isDefault(eBD) && eExcel && norm(eBD) !== norm(eExcel)) {
    eAction = `CONFLICTO estado: BD="${eBD}" vs Excel="${eExcel}"`;
  }

  // resultado
  let rExcel = d['¿Devolución procedió?'] || '';
  let rBD = bd.resultado;
  let rAction = '';
  if (rExcel && !rBD) {
    rAction = `resultado: null → "${rExcel}"`;
    updates.push(rAction);
  } else if (rExcel && rBD && norm(rExcel) !== norm(rBD)) {
    rAction = `CONFLICTO resultado: BD="${rBD}" vs Excel="${rExcel}"`;
  }

  // monto_pagado
  let mExcel = d['Monto solicitado'];
  let mBD = bd.monto_pagado;
  let mAction = '';
  if (mExcel !== null && mBD === null) {
    mAction = `monto_pagado: null → ${mExcel}`;
    updates.push(mAction);
  } else if (mExcel !== null && mBD !== null && !numEq(mExcel, mBD)) {
    mAction = `CONFLICTO monto_pagado: BD=${mBD} vs Excel=${mExcel}`;
  }

  // monto_devuelto
  let mdExcel = d['Monto real a devolver'];
  let mdBD = bd.monto_devuelto;
  let mdAction = '';
  if (mdExcel !== null && mdBD === null) {
    mdAction = `monto_devuelto: null → ${mdExcel}`;
    updates.push(mdAction);
  } else if (mdExcel !== null && mdBD !== null && !numEq(mdExcel, mdBD)) {
    mdAction = `CONFLICTO monto_devuelto: BD=${mdBD} vs Excel=${mdExcel}`;
  }

  // porcentaje
  let pExcel = d['% conciliación'];
  let pBD = bd.porcentaje;
  let pAction = '';
  if (pExcel !== null && pBD === null) {
    pAction = `porcentaje: null → ${pExcel}`;
    updates.push(pAction);
  } else if (pExcel !== null && pBD !== null && !numEq(pExcel, pBD)) {
    pAction = `CONFLICTO porcentaje: BD=${pBD} vs Excel=${pExcel}`;
  }

  // tipo_monto
  let tmExcel = d['Tipo monto'] || '';
  let tmBD = bd.tipo_monto;
  let tmAction = '';
  if (tmExcel && !tmBD) {
    tmAction = `tipo_monto: null → "${tmExcel}"`;
    updates.push(tmAction);
  } else if (tmExcel && tmBD && norm(tmExcel) !== norm(tmBD)) {
    tmAction = `CONFLICTO tipo_monto: BD="${tmBD}" vs Excel="${tmExcel}"`;
  }

  const hasConflict = [eAction, rAction, mAction, mdAction, pAction, tmAction].some(a => a.startsWith('CONFLICTO'));

  let clasificacion: string;
  if (updates.length > 0 && !hasConflict) {
    clasificacion = 'RECUPERABLE';
  } else if (updates.length > 0 && hasConflict) {
    clasificacion = 'RECUPERABLE_CON_CONFLICTO';
  } else if (hasConflict) {
    clasificacion = 'CONFLICTO';
  } else {
    clasificacion = 'IGUAL';
  }

  results.push({
    ticket_id: tid, caso_excel: casoExcel, caso_bd: bd.numero, tipo: 'devolucion',
    origen_bd: bd.origen, estado_bd: bd.estado, estado_excel: eExcel,
    resultado_bd: bd.resultado || '', resultado_excel: rExcel,
    monto_pagado_bd: bd.monto_pagado, monto_pagado_excel: mExcel,
    monto_devuelto_bd: bd.monto_devuelto, monto_devuelto_excel: mdExcel,
    porcentaje_bd: bd.porcentaje, porcentaje_excel: pExcel,
    tipo_monto_bd: bd.tipo_monto, tipo_monto_excel: tmExcel,
    moneda_bd: bd.moneda, moneda_excel: d['Moneda'] || '',
    clasificacion, updates,
  });
}

// Process Quejas
for (const q of quejaData) {
  const tid = String(q['ID ticket']);
  const bd = bdMap.get(tid);
  const casoExcel = q['Caso'] || '';

  if (!bd) {
    results.push({
      ticket_id: tid, caso_excel: casoExcel, caso_bd: 'NO EXISTE', tipo: 'queja',
      origen_bd: 'NO EXISTE', estado_bd: '', estado_excel: q['Estado'] || '',
      resultado_bd: '', resultado_excel: q['Resultado'] || '',
      monto_pagado_bd: null, monto_pagado_excel: null,
      monto_devuelto_bd: null, monto_devuelto_excel: null,
      porcentaje_bd: null, porcentaje_excel: null,
      tipo_monto_bd: '', tipo_monto_excel: '',
      moneda_bd: '', moneda_excel: '',
      clasificacion: 'NO_EXISTE_EN_BD', updates: [],
    });
    continue;
  }

  // MANUAL = PROTECTED
  if (bd.origen === 'MANUAL') {
    const eMatch = norm(bd.estado) === norm(q['Estado']);
    const rMatch = norm(bd.resultado) === norm(q['Resultado']);
    results.push({
      ticket_id: tid, caso_excel: casoExcel, caso_bd: bd.numero, tipo: 'queja',
      origen_bd: bd.origen, estado_bd: bd.estado, estado_excel: q['Estado'] || '',
      resultado_bd: bd.resultado || '', resultado_excel: q['Resultado'] || '',
      monto_pagado_bd: null, monto_pagado_excel: null,
      monto_devuelto_bd: null, monto_devuelto_excel: null,
      porcentaje_bd: null, porcentaje_excel: null,
      tipo_monto_bd: null, tipo_monto_excel: '',
      moneda_bd: bd.moneda, moneda_excel: '',
      clasificacion: (eMatch && rMatch) ? 'IGUAL' : 'CONFLICTO_MANUAL',
      updates: [],
    });
    continue;
  }

  // BACKFILL logic for quejas
  const updates: string[] = [];
  const eExcel = q['Estado'] || '';
  const eBD = bd.estado;
  let eAction = '';
  if (isDefault(eBD) && eExcel && norm(eExcel) !== norm(eBD)) {
    eAction = `estado: "${eBD}" → "${eExcel}"`;
    updates.push(eAction);
  } else if (!isDefault(eBD) && eExcel && norm(eBD) !== norm(eExcel)) {
    eAction = `CONFLICTO estado: BD="${eBD}" vs Excel="${eExcel}"`;
  }

  const rExcel = q['Resultado'] || '';
  const rBD = bd.resultado;
  let rAction = '';
  if (rExcel && !rBD) {
    rAction = `resultado: null → "${rExcel}"`;
    updates.push(rAction);
  } else if (rExcel && rBD && norm(rExcel) !== norm(rBD)) {
    rAction = `CONFLICTO resultado: BD="${rBD}" vs Excel="${rExcel}"`;
  }

  const hasConflict = [eAction, rAction].some(a => a.startsWith('CONFLICTO'));
  let clasificacion: string;
  if (updates.length > 0 && !hasConflict) {
    clasificacion = 'RECUPERABLE';
  } else if (hasConflict) {
    clasificacion = 'CONFLICTO';
  } else {
    clasificacion = 'IGUAL';
  }

  results.push({
    ticket_id: tid, caso_excel: casoExcel, caso_bd: bd.numero, tipo: 'queja',
    origen_bd: bd.origen, estado_bd: bd.estado, estado_excel: eExcel,
    resultado_bd: bd.resultado || '', resultado_excel: rExcel,
    monto_pagado_bd: null, monto_pagado_excel: null,
    monto_devuelto_bd: null, monto_devuelto_excel: null,
    porcentaje_bd: null, porcentaje_excel: null,
    tipo_monto_bd: null, tipo_monto_excel: '',
    moneda_bd: bd.moneda, moneda_excel: '',
    clasificacion, updates,
  });
}

// Sort
const order: Record<string, number> = { 'NO_EXISTE_EN_BD': 0, 'RECUPERABLE': 1, 'RECUPERABLE_CON_CONFLICTO': 2, 'CONFLICTO': 3, 'CONFLICTO_MANUAL': 4, 'IGUAL': 5 };
results.sort((a, b) => (order[a.clasificacion] ?? 6) - (order[b.clasificacion] ?? 6) || Number(a.ticket_id) - Number(b.ticket_id));

// === OUTPUT ===

const total = results.length;
const iguales = results.filter(r => r.clasificacion === 'IGUAL');
const recuperables = results.filter(r => r.clasificacion === 'RECUPERABLE');
const recConflicto = results.filter(r => r.clasificacion === 'RECUPERABLE_CON_CONFLICTO');
const conflictos = results.filter(r => r.clasificacion === 'CONFLICTO');
const conflictManual = results.filter(r => r.clasificacion === 'CONFLICTO_MANUAL');
const noExiste = results.filter(r => r.clasificacion === 'NO_EXISTE_EN_BD');

console.log('\n========================================');
console.log('DRY RUN DEFINITIVO — RECUPERACIÓN QYD');
console.log('========================================');

console.log('\n=== RESUMEN ===');
console.log(`Total Excel:              ${total}`);
console.log(`En BD:                     ${total - noExiste.length}`);
console.log(`IGUALES:                   ${iguales.length}`);
console.log(`RECUPERABLES:              ${recuperables.length}`);
console.log(`RECUPERABLES+CONFLICTO:    ${recConflicto.length}`);
console.log(`CONFLICTOS (no tocar):     ${conflictos.length}`);
console.log(`CONFLICTO_MANUAL (proteg): ${conflictManual.length}`);
console.log(`NO EXISTEN EN BD:          ${noExiste.length}`);

// Sum check
const sumRecuperables = iguales.length + recuperables.length + recConflicto.length + conflictos.length + conflictManual.length + noExiste.length;
console.log(`\nVerificación suma: ${sumRecuperables} = ${total} ? ${sumRecuperables === total ? 'OK' : 'ERROR'}`);

// By type
console.log('\n=== RECUPERABLES POR TIPO ===');
const recDev = recuperables.filter(r => r.tipo === 'devolucion');
const recQueja = recuperables.filter(r => r.tipo === 'queja');
console.log(`DEVOLUCIONES: ${recDev.length}`);
console.log(`QUEJAS:       ${recQueja.length}`);
console.log(`TOTAL:        ${recDev.length + recQueja.length}`);

// Field counts
const fieldCounts: Record<string, number> = {};
for (const r of recuperables) {
  for (const u of r.updates) {
    const campo = u.split(':')[0].trim();
    fieldCounts[campo] = (fieldCounts[campo] || 0) + 1;
  }
}
console.log('\n=== RECUPERACIONES POR CAMPO ===');
for (const [campo, count] of Object.entries(fieldCounts)) {
  console.log(`${campo}: ${count}`);
}

// Full matrix
console.log('\n=== MATRIZ DEFINITIVA ===');
console.log('ticket | caso_bd | tipo | origen | estado_bd | estado_excel | resultado_bd | resultado_excel | monto_bd | monto_excel | %_bd | %_excel | tm_bd | tm_excel | clasificacion');
for (const r of results) {
  console.log(`${r.ticket_id} | ${r.caso_bd} | ${r.tipo} | ${r.origen_bd} | ${r.estado_bd} | ${r.estado_excel} | ${r.resultado_bd} | ${r.resultado_excel} | ${r.monto_pagado_bd || 'null'} | ${r.monto_pagado_excel ?? 'null'} | ${r.porcentaje_bd || 'null'} | ${r.porcentaje_excel ?? 'null'} | ${r.tipo_monto_bd || 'null'} | ${r.tipo_monto_excel} | ${r.clasificacion}`);
}

// All recoverable cases
console.log('\n=== TODOS LOS RECUPERABLES (DETALLE) ===');
for (const r of recuperables) {
  console.log(`\n${r.caso_bd} | ticket ${r.ticket_id} | ${r.tipo} | origen: ${r.origen_bd}`);
  for (const u of r.updates) {
    console.log(`  → ${u}`);
  }
}

// NO EXISTE details
console.log('\n=== NO EXISTEN EN BD (7 tickets) ===');
for (const r of noExiste) {
  console.log(`${r.ticket_id} | ${r.caso_excel} | ${r.tipo} | Excel estado: ${r.estado_excel} | Excel resultado: ${r.resultado_excel || '-'} | Excel monto: ${r.monto_pagado_excel ?? '-'}`);
}

// MANUAL conflicts
if (conflictManual.length > 0) {
  console.log('\n=== CONFLICTOS MANUALES (PROTEGIDOS — NO TOCAR) ===');
  for (const r of conflictManual) {
    console.log(`${r.ticket_id} | ${r.caso_bd} | ${r.tipo} | BD estado: ${r.estado_bd} | Excel estado: ${r.estado_excel}`);
  }
}
