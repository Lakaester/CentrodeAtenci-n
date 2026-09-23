import * as XLSX from 'xlsx';
import * as path from 'path';

const EXCEL_PATH = 'C:\\Users\\acast\\Downloads\\Quejas_Devoluciones_2026-09-08 (1).xlsx';

const workbook = XLSX.readFile(EXCEL_PATH);

console.log('=== HOJAS DISPONIBLES ===');
console.log(workbook.SheetNames);

// Parse Devoluciones
const devSheet = workbook.Sheets['Devoluciones'];
const devData: Record<string, any>[] = XLSX.utils.sheet_to_json(devSheet, { defval: null });

console.log('\n=== DEVOLUCIONES ===');
console.log(`Total registros: ${devData.length}`);
if (devData.length > 0) {
  console.log('Columnas:', Object.keys(devData[0] as object));
}

// Parse Quejas
const quejaSheet = workbook.Sheets['Quejas'];
const quejaData: Record<string, any>[] = XLSX.utils.sheet_to_json(quejaSheet, { defval: null });

console.log('\n=== QUEJAS ===');
console.log(`Total registros: ${quejaData.length}`);
if (quejaData.length > 0) {
  console.log('Columnas:', Object.keys(quejaData[0] as object));
}

// Output all data as JSON for analysis
console.log('\n=== DEVOLUCIONES_DATA ===');
console.log(JSON.stringify(devData, null, 2));

console.log('\n=== QUEJAS_DATA ===');
console.log(JSON.stringify(quejaData, null, 2));
