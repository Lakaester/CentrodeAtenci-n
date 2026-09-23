import * as XLSX from 'xlsx';

const EXCEL_PATH = 'C:\\Users\\acast\\Downloads\\Quejas_Devoluciones_2026-09-08 (1).xlsx';
const workbook = XLSX.readFile(EXCEL_PATH);

const devData: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets['Devoluciones'], { defval: null });
const quejaData: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets['Quejas'], { defval: null });

// BD data (from query results - pasted as JSON)
const bdData: Record<string, any>[] = [
  // DEVOLUCIONES
  { ticket_id: "5221", numero: "DEV-05221", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "Solicitud de devolución" },
  { ticket_id: "5646", numero: "DEV-05646", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "Solicitud de devolución" },
  { ticket_id: "8230", numero: "DEV-08230", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "Solicitud de devolución" },
  { ticket_id: "8578", numero: "DEV-08578", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "Solicitud de devolución" },
  { ticket_id: "24894", numero: "DEV-10729", estado: "Resuelto", resultado: "No procede", monto_pagado: "423.72", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL", observacion: null },
  { ticket_id: "30146", numero: "DEV-16270", estado: "Resuelto", resultado: "No procede", monto_pagado: "490.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "USD", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "28297", numero: "DEV-16874", estado: "Resuelto", resultado: "No procede", monto_pagado: "300.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL", observacion: null },
  { ticket_id: "31559", numero: "DEV-31559", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud de devolución" },
  { ticket_id: "31593", numero: "DEV-31593", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud de devolución" },
  { ticket_id: "31795", numero: "DEV-31795", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud_de_devolución" },
  { ticket_id: "32252", numero: "DEV-32252", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud_de_devolución" },
  { ticket_id: "32273", numero: "DEV-32273", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud_de_devolución" },
  { ticket_id: "32492", numero: "DEV-32492", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud_de_devolución" },
  { ticket_id: "32584", numero: "DEV-32584", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud_de_devolución" },
  { ticket_id: "29523", numero: "DEV-32998", estado: "Resuelto", resultado: "Procede 100%", monto_pagado: "2055.00", monto_devuelto: "2055.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "33068", numero: "DEV-33068", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "solicitud_de_devolución" },
  { ticket_id: "28075", numero: "DEV-36067", estado: "Resuelto", resultado: "No procede", monto_pagado: "2470.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "27919", numero: "DEV-45461", estado: "Resuelto", resultado: "Procede parcialmente", monto_pagado: "900.00", monto_devuelto: "299.97", porcentaje: "33.33", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "31753", numero: "DEV-52537", estado: "Resuelto", resultado: "Procede 100%", monto_pagado: "2565.00", monto_devuelto: "2565.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "21281", numero: "DEV-68078", estado: "Resuelto", resultado: "No procede", monto_pagado: "1150.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "29937", numero: "DEV-68407", estado: "Pendiente de conciliación", resultado: "Pendiente", monto_pagado: "1270.00", monto_devuelto: "635.00", porcentaje: "50.00", moneda: "USD", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "29164", numero: "DEV-69171", estado: "Resuelto", resultado: "No procede", monto_pagado: "2160.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "ARR", origen: "MANUAL", observacion: null },
  { ticket_id: "33352", numero: "DEV-75590", estado: "Pendiente de aprobación", resultado: "Pendiente", monto_pagado: "150.00", monto_devuelto: "150.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL", observacion: null },
  { ticket_id: "23739", numero: "DEV-84497", estado: "Resuelto", resultado: "Procede 100%", monto_pagado: "308.00", monto_devuelto: "308.00", porcentaje: "100.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL", observacion: null },
  { ticket_id: "31550", numero: "DEV-92678", estado: "Resuelto", resultado: "No procede", monto_pagado: "250.00", monto_devuelto: "0.00", porcentaje: "0.00", moneda: "PEN", tipo_monto: "MRR", origen: "MANUAL", observacion: null },
  // QUEJAS
  { ticket_id: "7709", numero: "QUE-07709", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "Queja" },
  { ticket_id: "30544", numero: "QUE-30544", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "30651", numero: "QUE-30651", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "30713", numero: "QUE-30713", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "30890", numero: "QUE-30890", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "31060", numero: "QUE-31060", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "31415", numero: "QUE-31415", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "31451", numero: "QUE-31451", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "31509", numero: "QUE-31509", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "31511", numero: "QUE-31511", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "31921", numero: "QUE-31921", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32027", numero: "QUE-32027", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32220", numero: "QUE-32220", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32406", numero: "QUE-32406", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32407", numero: "QUE-32407", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32638", numero: "QUE-32638", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32641", numero: "QUE-32641", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32644", numero: "QUE-32644", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "32682", numero: "QUE-32682", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "33055", numero: "QUE-33055", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
  { ticket_id: "33144", numero: "QUE-33144", estado: "Pendiente de conciliación", resultado: null, monto_pagado: null, monto_devuelto: null, porcentaje: null, moneda: "PEN", tipo_monto: null, origen: "BACKFILL", observacion: "queja" },
];

// Build BD lookup by ticket_id
const bdMap = new Map<string, Record<string, any>>();
for (const row of bdData) {
  bdMap.set(String(row.ticket_id), row);
}

// Normalize for comparison
function norm(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  return String(val).trim().toLowerCase();
}

function numEq(a: any, b: any): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Number(a) === Number(b);
}

// Compare Devoluciones
interface Comparison {
  ticket_id: string;
  caso_excel: string;
  caso_bd: string;
  tipo: string;
  origen_bd: string;
  estado_excel: string;
  estado_bd: string;
  resultado_excel: string;
  resultado_bd: string;
  monto_excel: number | null;
  monto_bd: string | null;
  monto_devuelto_excel: number | null;
  monto_devuelto_bd: string | null;
  porcentaje_excel: number | null;
  porcentaje_bd: string | null;
  moneda_excel: string;
  moneda_bd: string;
  tipo_monto_excel: string;
  tipo_monto_bd: string | null;
  clasificacion: string;
  campos_recuperables: string[];
  campos_conflicto: string[];
}

const results: Comparison[] = [];

for (const dev of devData) {
  const ticketId = String(dev['ID ticket']);
  const bd = bdMap.get(ticketId);

  if (!bd) {
    results.push({
      ticket_id: ticketId,
      caso_excel: dev['Caso'],
      caso_bd: 'NO EXISTE',
      tipo: 'devolucion',
      origen_bd: 'NO EXISTE',
      estado_excel: dev['Estado'] || '',
      estado_bd: '',
      resultado_excel: dev['¿Devolución procedió?'] || '',
      resultado_bd: '',
      monto_excel: dev['Monto solicitado'],
      monto_bd: null,
      monto_devuelto_excel: dev['Monto real a devolver'],
      monto_devuelto_bd: null,
      porcentaje_excel: dev['% conciliación'],
      porcentaje_bd: null,
      moneda_excel: dev['Moneda'] || '',
      moneda_bd: '',
      tipo_monto_excel: dev['Tipo monto'] || '',
      tipo_monto_bd: '',
      clasificacion: 'NO_EXISTE_EN_BD',
      campos_recuperables: [],
      campos_conflicto: [],
    });
    continue;
  }

  const camposRecuperables: string[] = [];
  const camposConflicto: string[] = [];

  // estado
  const eExcel = norm(dev['Estado']);
  const eBD = norm(bd.estado);
  if (eExcel && eBD && eExcel !== eBD) {
    camposConflicto.push(`estado: BD="${bd.estado}" vs Excel="${dev['Estado']}"`);
  } else if (eExcel && (!eBD || eBD === 'pendiente de conciliación')) {
    camposRecuperables.push(`estado: BD="${bd.estado}" → Excel="${dev['Estado']}"`);
  }

  // resultado
  const rExcel = norm(dev['¿Devolución procedió?']);
  const rBD = norm(bd.resultado);
  if (rExcel && rBD && rExcel !== rBD) {
    camposConflicto.push(`resultado: BD="${bd.resultado}" vs Excel="${dev['¿Devolución procedió?']}"`);
  } else if (rExcel && !rBD) {
    camposRecuperables.push(`resultado: BD=null → Excel="${dev['¿Devolución procedió?']}"`);
  }

  // monto_pagado (Monto solicitado)
  const mExcel = dev['Monto solicitado'];
  const mBD = bd.monto_pagado;
  if (mExcel !== null && mBD !== null && !numEq(mExcel, mBD)) {
    camposConflicto.push(`monto_pagado: BD=${mBD} vs Excel=${mExcel}`);
  } else if (mExcel !== null && mBD === null) {
    camposRecuperables.push(`monto_pagado: BD=null → Excel=${mExcel}`);
  }

  // monto_devuelto (Monto real a devolver)
  const mdExcel = dev['Monto real a devolver'];
  const mdBD = bd.monto_devuelto;
  if (mdExcel !== null && mdBD !== null && !numEq(mdExcel, mdBD)) {
    camposConflicto.push(`monto_devuelto: BD=${mdBD} vs Excel=${mdExcel}`);
  } else if (mdExcel !== null && mdBD === null) {
    camposRecuperables.push(`monto_devuelto: BD=null → Excel=${mdExcel}`);
  }

  // porcentaje
  const pExcel = dev['% conciliación'];
  const pBD = bd.porcentaje;
  if (pExcel !== null && pBD !== null && !numEq(pExcel, pBD)) {
    camposConflicto.push(`porcentaje: BD=${pBD} vs Excel=${pExcel}`);
  } else if (pExcel !== null && pBD === null) {
    camposRecuperables.push(`porcentaje: BD=null → Excel=${pExcel}`);
  }

  // moneda
  const cExcel = norm(dev['Moneda']);
  const cBD = norm(bd.moneda);
  if (cExcel && cBD && cExcel !== cBD) {
    camposConflicto.push(`moneda: BD="${bd.moneda}" vs Excel="${dev['Moneda']}"`);
  }

  // tipo_monto
  const tmExcel = norm(dev['Tipo monto']);
  const tmBD = norm(bd.tipo_monto);
  if (tmExcel && tmBD && tmExcel !== tmBD) {
    camposConflicto.push(`tipo_monto: BD="${bd.tipo_monto}" vs Excel="${dev['Tipo monto']}"`);
  } else if (tmExcel && !tmBD) {
    camposRecuperables.push(`tipo_monto: BD=null → Excel="${dev['Tipo monto']}"`);
  }

  // Determine classification
  let clasificacion: string;
  if (camposConflicto.length > 0 && camposRecuperables.length > 0) {
    clasificacion = 'CONFLICTO+RECUPERABLE';
  } else if (camposConflicto.length > 0) {
    clasificacion = 'CONFLICTO';
  } else if (camposRecuperables.length > 0) {
    clasificacion = 'RECUPERABLE';
  } else {
    clasificacion = 'IGUAL';
  }

  results.push({
    ticket_id: ticketId,
    caso_excel: dev['Caso'],
    caso_bd: bd.numero,
    tipo: 'devolucion',
    origen_bd: bd.origen,
    estado_excel: dev['Estado'] || '',
    estado_bd: bd.estado,
    resultado_excel: dev['¿Devolución procedió?'] || '',
    resultado_bd: bd.resultado || '',
    monto_excel: mExcel,
    monto_bd: mBD,
    monto_devuelto_excel: mdExcel,
    monto_devuelto_bd: mdBD,
    porcentaje_excel: pExcel,
    porcentaje_bd: pBD,
    moneda_excel: dev['Moneda'] || '',
    moneda_bd: bd.moneda,
    tipo_monto_excel: dev['Tipo monto'] || '',
    tipo_monto_bd: bd.tipo_monto,
    clasificacion,
    campos_recuperables: camposRecuperables,
    campos_conflicto: camposConflicto,
  });
}

// Compare Quejas
for (const q of quejaData) {
  const ticketId = String(q['ID ticket']);
  const bd = bdMap.get(ticketId);

  if (!bd) {
    results.push({
      ticket_id: ticketId,
      caso_excel: q['Caso'],
      caso_bd: 'NO EXISTE',
      tipo: 'queja',
      origen_bd: 'NO EXISTE',
      estado_excel: q['Estado'] || '',
      estado_bd: '',
      resultado_excel: q['Resultado'] || '',
      resultado_bd: '',
      monto_excel: null,
      monto_bd: null,
      monto_devuelto_excel: null,
      monto_devuelto_bd: null,
      porcentaje_excel: null,
      porcentaje_bd: null,
      moneda_excel: '',
      moneda_bd: '',
      tipo_monto_excel: '',
      tipo_monto_bd: '',
      clasificacion: 'NO_EXISTE_EN_BD',
      campos_recuperables: [],
      campos_conflicto: [],
    });
    continue;
  }

  const camposRecuperables: string[] = [];
  const camposConflicto: string[] = [];

  // estado
  const eExcel = norm(q['Estado']);
  const eBD = norm(bd.estado);
  if (eExcel && eBD && eExcel !== eBD) {
    camposConflicto.push(`estado: BD="${bd.estado}" vs Excel="${q['Estado']}"`);
  } else if (eExcel && (!eBD || eBD === 'pendiente de conciliación')) {
    camposRecuperables.push(`estado: BD="${bd.estado}" → Excel="${q['Estado']}"`);
  }

  // resultado
  const rExcel = norm(q['Resultado']);
  const rBD = norm(bd.resultado);
  if (rExcel && rBD && rExcel !== rBD) {
    camposConflicto.push(`resultado: BD="${bd.resultado}" vs Excel="${q['Resultado']}"`);
  } else if (rExcel && !rBD) {
    camposRecuperables.push(`resultado: BD=null → Excel="${q['Resultado']}"`);
  }

  let clasificacion: string;
  if (camposConflicto.length > 0 && camposRecuperables.length > 0) {
    clasificacion = 'CONFLICTO+RECUPERABLE';
  } else if (camposConflicto.length > 0) {
    clasificacion = 'CONFLICTO';
  } else if (camposRecuperables.length > 0) {
    clasificacion = 'RECUPERABLE';
  } else {
    clasificacion = 'IGUAL';
  }

  results.push({
    ticket_id: ticketId,
    caso_excel: q['Caso'],
    caso_bd: bd.numero,
    tipo: 'queja',
    origen_bd: bd.origen,
    estado_excel: q['Estado'] || '',
    estado_bd: bd.estado,
    resultado_excel: q['Resultado'] || '',
    resultado_bd: bd.resultado || '',
    monto_excel: null,
    monto_bd: null,
    monto_devuelto_excel: null,
    monto_devuelto_bd: null,
    porcentaje_excel: null,
    porcentaje_bd: null,
    moneda_excel: '',
    moneda_bd: bd.moneda,
    tipo_monto_excel: '',
    tipo_monto_bd: null,
    clasificacion,
    campos_recuperables: camposRecuperables,
    campos_conflicto: camposConflicto,
  });
}

// Sort by clasificacion then ticket_id
results.sort((a, b) => {
  const order: Record<string, number> = { 'NO_EXISTE_EN_BD': 0, 'RECUPERABLE': 1, 'CONFLICTO+RECUPERABLE': 2, 'CONFLICTO': 3, 'IGUAL': 4 };
  const oa = order[a.clasificacion] ?? 5;
  const ob = order[b.clasificacion] ?? 5;
  if (oa !== ob) return oa - ob;
  return Number(a.ticket_id) - Number(b.ticket_id);
});

// Summary
const total = results.length;
const iguales = results.filter(r => r.clasificacion === 'IGUAL').length;
const recuperables = results.filter(r => r.clasificacion === 'RECUPERABLE').length;
const conflictoRecuperable = results.filter(r => r.clasificacion === 'CONFLICTO+RECUPERABLE').length;
const conflictos = results.filter(r => r.clasificacion === 'CONFLICTO').length;
const noExiste = results.filter(r => r.clasificacion === 'NO_EXISTE_EN_BD').length;

console.log('\n=== RESUMEN ===');
console.log(`Total Excel: ${total}`);
console.log(`IGUALES: ${iguales}`);
console.log(`RECUPERABLES: ${recuperables}`);
console.log(`CONFLICTO+RECUPERABLE: ${conflictoRecuperable}`);
console.log(`CONFLICTOS: ${conflictos}`);
console.log(`NO EXISTEN EN BD: ${noExiste}`);

// Field-level recovery counts
let recoverEstado = 0, recoverResultado = 0, recoverMonto = 0, recoverMontoDev = 0, recoverPorcentaje = 0, recoverTipoMonto = 0;
for (const r of results) {
  for (const c of r.campos_recuperables) {
    if (c.startsWith('estado:')) recoverEstado++;
    if (c.startsWith('resultado:')) recoverResultado++;
    if (c.startsWith('monto_pagado:')) recoverMonto++;
    if (c.startsWith('monto_devuelto:')) recoverMontoDev++;
    if (c.startsWith('porcentaje:')) recoverPorcentaje++;
    if (c.startsWith('tipo_monto:')) recoverTipoMonto++;
  }
}

console.log('\n=== RECUPERACIÓN POR CAMPO ===');
console.log(`estado: ${recoverEstado}`);
console.log(`resultado: ${recoverResultado}`);
console.log(`monto_pagado (solicitado): ${recoverMonto}`);
console.log(`monto_devuelto (real): ${recoverMontoDev}`);
console.log(`% conciliación: ${recoverPorcentaje}`);
console.log(`tipo_monto: ${recoverTipoMonto}`);

// Print full matrix
console.log('\n=== MATRIZ COMPLETA ===');
console.log('ticket_id | caso | tipo | origen | estado_bd | estado_excel | resultado_bd | resultado_excel | monto_bd | monto_excel | %_bd | %_excel | clasificacion');
for (const r of results) {
  console.log(`${r.ticket_id} | ${r.caso_bd} | ${r.tipo} | ${r.origen_bd} | ${r.estado_bd} | ${r.estado_excel} | ${r.resultado_bd} | ${r.resultado_excel} | ${r.monto_bd || 'null'} | ${r.monto_excel ?? 'null'} | ${r.porcentaje_bd || 'null'} | ${r.porcentaje_excel ?? 'null'} | ${r.clasificacion}`);
}

// Print critical cases (RECUPERABLES)
console.log('\n=== CASOS CRÍTICOS (RECUPERABLES) ===');
const criticos = results.filter(r => r.clasificacion.includes('RECUPERABLE'));
for (const r of criticos) {
  console.log(`\n--- ${r.caso_bd} / ticket ${r.ticket_id} (origen: ${r.origen_bd}) ---`);
  for (const c of r.campos_recuperables) {
    console.log(`  ${c}`);
  }
  for (const c of r.campos_conflicto) {
    console.log(`  CONFLICTO: ${c}`);
  }
}

// Print conflicts
console.log('\n=== CONFLICTOS (NO TOCAR) ===');
const conflictoOnly = results.filter(r => r.clasificacion === 'CONFLICTO');
for (const r of conflictoOnly) {
  console.log(`\n--- ${r.caso_bd} / ticket ${r.ticket_id} ---`);
  for (const c of r.campos_conflicto) {
    console.log(`  ${c}`);
  }
}
