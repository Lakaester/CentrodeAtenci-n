/**
 * Migración reversible de public.v_unificado para incorporar a Alex Lopez.
 *
 * Acciones:
 *   npx tsx scripts/migrar-vista-alex.ts backup
 *   npx tsx scripts/migrar-vista-alex.ts apply
 *   npx tsx scripts/migrar-vista-alex.ts rollback
 *   npx tsx scripts/migrar-vista-alex.ts verify
 *
 * `backup` guarda la definición original y la línea base por asesor.
 * `apply` reemplaza la vista dentro de una transacción y valida:
 *   - Alex aparece con el mismo total que en las fuentes.
 *   - Los demás asesores no cambian.
 *   - No hay duplicados en la clave de atención.
 * `rollback` restaura la definición original y comprueba que Alex vuelve a 0.
 */
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/repositories/prisma";

const DIR = join(process.cwd(), "sql", "migrations");
const BACKUP = join(DIR, "backup-v-unificado-2026-11-03.sql");
const MIGRATION = join(DIR, "v-unificado-incluir-alex.sql");
const BASELINE = join(DIR, "baseline-asesores-2026-11-03.json");
const ALEX = "alex lopez";

type Conteo = { asesor: string; total: number };
type Fuente = { fuente: string; total: number; meses: { mes: string; total: number }[] };

function normalizarDef(def: string): string {
  return def.trim().replace(/;+\s*$/, "");
}

function sqlView(def: string, titulo: string): string {
  return `-- ${titulo}\n-- Generado: 2026-11-03\nCREATE OR REPLACE VIEW public.v_unificado AS\n${normalizarDef(def)};\n`;
}

function patch(def: string): string {
  if (def.toLowerCase().includes(ALEX)) return normalizarDef(def);
  const exacto = "'cesar espinoza'::text]))";
  const unaccent = "unaccent('cesar espinoza'::text)]))";
  if (!def.includes(exacto) || !def.includes(unaccent)) {
    throw new Error("No se encontró el ancla de la lista blanca (cesar espinoza).");
  }
  let out = def.replace(exacto, "'cesar espinoza'::text, 'alex lopez'::text]))");
  out = out.replace(
    unaccent,
    "unaccent('cesar espinoza'::text), unaccent('alex lopez'::text)]))",
  );
  const veces = (out.match(new RegExp(`'${ALEX}'`, "gi")) ?? []).length;
  const unaccentVeces = (out.match(new RegExp(`unaccent\\('${ALEX}'`, "gi")) ?? []).length;
  if (veces !== 2 || unaccentVeces !== 1) {
    throw new Error(`Parche inválido: ${veces} apariciones y ${unaccentVeces} unaccent.`);
  }
  return normalizarDef(out);
}

async function definicionActual(): Promise<string> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT pg_get_viewdef('public.v_unificado'::regclass, true) AS def`,
  )) as { def: string }[];
  return normalizarDef(rows[0].def);
}

async function columnas(tabla: string): Promise<string[]> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${tabla}'`,
  )) as { column_name: string }[];
  return rows.map((r) => r.column_name);
}

async function tablaZendesk(): Promise<string> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%zendesk%' AND table_name ILIKE '%categor%'`,
  )) as { table_name: string }[];
  if (!rows[0]) throw new Error("No se encontró la tabla de Zendesk.");
  return rows[0].table_name;
}

function buscarColumna(cols: string[], nombre: string): string {
  const found = cols.find((c) => c.toLowerCase() === nombre.toLowerCase());
  if (!found) throw new Error(`No se encontró la columna ${nombre}.`);
  return found;
}

async function fuentes(): Promise<Fuente[]> {
  const zm = await columnas("Whatmeta");
  const zw = await columnas("Whaticket");
  const fechaMeta = buscarColumna(zm, "CREACIÓN_FECHA");
  const fechaWhaticket = buscarColumna(zw, "CREACIÓN_FECHA");
  const zend = await tablaZendesk();
  const zc = await columnas(zend);
  const fechaZend = buscarColumna(zc, "tickets_created_at");
  const nameZend = buscarColumna(zc, "name");

  const queries: { fuente: string; sql: string }[] = [
    {
      fuente: "WHATMETA",
      sql: `SELECT to_char(date_trunc('month', "${fechaMeta}"), 'YYYY-MM') AS mes, COUNT(*)::int AS total
            FROM "Whatmeta" WHERE "ASIGNADO" ILIKE '%alex%' GROUP BY 1 ORDER BY 1`,
    },
    {
      fuente: "WHATICKET",
      sql: `SELECT to_char(date_trunc('month', "${fechaWhaticket}"), 'YYYY-MM') AS mes, COUNT(*)::int AS total
            FROM "Whaticket" WHERE "ASIGNADO" ILIKE '%alex%' GROUP BY 1 ORDER BY 1`,
    },
    {
      fuente: "ZENDESK",
      sql: `SELECT to_char(date_trunc('month', "${fechaZend}"), 'YYYY-MM') AS mes, COUNT(*)::int AS total
            FROM "${zend}" WHERE "${nameZend}" ILIKE '%alex%' GROUP BY 1 ORDER BY 1`,
    },
  ];

  const out: Fuente[] = [];
  for (const q of queries) {
    const meses = (await prisma.$queryRawUnsafe(q.sql)) as { mes: string; total: number }[];
    out.push({ fuente: q.fuente, total: meses.reduce((s, r) => s + r.total, 0), meses });
  }
  return out;
}

async function conteos(): Promise<{ total: number; asesores: Conteo[] }> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT COALESCE(NULLIF(TRIM(asesor), ''), '(sin asesor)') AS asesor, COUNT(*)::int AS total
     FROM public.v_unificado_norm GROUP BY 1 ORDER BY 1`,
  )) as Conteo[];
  return { total: rows.reduce((s, r) => s + r.total, 0), asesores: rows };
}

async function alexEnVista(): Promise<{ total: number; claves: number }> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS total, COUNT(DISTINCT subcanal || ':' || ticket_id::text)::int AS claves
     FROM public.v_unificado_norm WHERE asesor ILIKE '%alex%'`,
  )) as { total: number; claves: number }[];
  return rows[0];
}

async function backup(): Promise<void> {
  if (existsSync(BACKUP)) {
    const def = await definicionActual();
    writeFileSync(MIGRATION, sqlView(patch(def), "Migración: incorporar Alex Lopez a public.v_unificado"), "utf8");
    console.log(`Respaldo ya existe: ${BACKUP}`);
    console.log(`Migración regenerada: ${MIGRATION}`);
    return;
  }
  mkdirSync(DIR, { recursive: true });
  const def = await definicionActual();
  if (def.toLowerCase().includes(ALEX)) throw new Error("La vista ya incluye a Alex; no se puede respaldar como original.");
  const fs = await fuentes();
  const base = await conteos();
  writeFileSync(BACKUP, sqlView(def, "Respaldo original de public.v_unificado"), "utf8");
  writeFileSync(MIGRATION, sqlView(patch(def), "Migración: incorporar Alex Lopez a public.v_unificado"), "utf8");
  writeFileSync(
    BASELINE,
    JSON.stringify(
      { fecha: "2026-11-03", total: base.total, asesores: base.asesores, fuenteAlex: fs },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`Respaldo: ${BACKUP}`);
  console.log(`Migración: ${MIGRATION}`);
  console.log(`Línea base: ${BASELINE}`);
  console.log(`Total antes: ${base.total}`);
  console.log(`Alex en fuentes: ${fs.reduce((s, f) => s + f.total, 0)}`);
}

function leerView(path: string): string {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/CREATE OR REPLACE VIEW public\.v_unificado AS\s*([\s\S]*?);\s*$/);
  if (!m) throw new Error(`No se pudo leer la definición de ${path}`);
  return m[1].trim();
}

async function reemplazar(def: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`CREATE OR REPLACE VIEW public.v_unificado AS\n${def}`);
    const alex = (await tx.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS total FROM public.v_unificado_norm WHERE asesor ILIKE '%alex%'`,
    )) as { total: number }[];
    const total = (await tx.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS total FROM public.v_unificado_norm`,
    )) as { total: number }[];
    console.log(`Dentro de la transacción: Alex=${alex[0].total}, total=${total[0].total}`);
  });
}

function mapaSinAlex(rows: Conteo[]): Map<string, number> {
  return new Map(
    rows
      .filter((r) => !r.asesor.toLowerCase().includes("alex"))
      .map((r) => [r.asesor, r.total]),
  );
}

function compararSinAlex(antes: Conteo[], despues: Conteo[]): void {
  const a = mapaSinAlex(antes);
  const d = mapaSinAlex(despues);
  const cambios: string[] = [];
  for (const nombre of new Set([...a.keys(), ...d.keys()])) {
    if ((a.get(nombre) ?? 0) !== (d.get(nombre) ?? 0)) {
      cambios.push(`${nombre}: ${a.get(nombre) ?? 0} -> ${d.get(nombre) ?? 0}`);
    }
  }
  if (cambios.length) throw new Error(`Cambios inesperados en asesores existentes: ${cambios.join("; ")}`);
}

async function apply(): Promise<void> {
  if (!existsSync(BACKUP) || !existsSync(MIGRATION)) {
    throw new Error("Ejecuta primero la acción backup.");
  }
  const antes = await conteos();
  const alexAntes = await alexEnVista();
  const fuente = await fuentes();
  const fuenteTotal = fuente.reduce((s, f) => s + f.total, 0);
  await reemplazar(leerView(MIGRATION));
  const despues = await conteos();
  const alex = await alexEnVista();

  if (alex.total !== fuenteTotal) {
    throw new Error(`Alex en vista (${alex.total}) no coincide con fuentes (${fuenteTotal}).`);
  }
  if (alex.claves !== alex.total) {
    throw new Error(`Alex tiene ${alex.total} filas pero ${alex.claves} claves; hay duplicados.`);
  }
  if (despues.total !== antes.total + fuenteTotal - alexAntes.total) {
    throw new Error(
      `Total después (${despues.total}) != antes (${antes.total}) + Alex (${fuenteTotal}) - Alex previo (${alexAntes.total}).`,
    );
  }
  compararSinAlex(antes.asesores, despues.asesores);
  console.log(`Aplicado. Alex=${alex.total}; total=${despues.total}.`);
}

async function rollback(): Promise<void> {
  if (!existsSync(BACKUP)) throw new Error("Falta el respaldo.");
  const antes = await conteos();
  const alexAntes = await alexEnVista();
  await reemplazar(leerView(BACKUP));
  const despues = await conteos();
  const alex = await alexEnVista();
  if (alex.total !== 0) throw new Error(`Rollback incompleto: Alex=${alex.total}.`);
  if (despues.total !== antes.total - alexAntes.total) {
    throw new Error(`Rollback: total ${despues.total} != ${antes.total} - Alex ${alexAntes.total}.`);
  }
  compararSinAlex(antes.asesores, despues.asesores);
  console.log(`Rollback verificado. Alex=0; total=${despues.total}.`);
}

async function verify(): Promise<void> {
  const base = existsSync(BASELINE) ? (JSON.parse(readFileSync(BASELINE, "utf8")) as { fuenteAlex: Fuente[]; total: number }) : null;
  const actual = await conteos();
  const alex = await alexEnVista();
  console.log(
    JSON.stringify(
      {
        total: actual.total,
        alex,
        fuentes: base?.fuenteAlex,
        totalFuente: base ? base.fuenteAlex.reduce((s, f) => s + f.total, 0) : null,
        asesores: actual.asesores,
      },
      null,
      2,
    ),
  );
}

async function main(): Promise<void> {
  const accion = process.argv[2];
  switch (accion) {
    case "backup":
      await backup();
      break;
    case "apply":
      await apply();
      break;
    case "rollback":
      await rollback();
      break;
    case "verify":
      await verify();
      break;
    default:
      throw new Error("Usa: backup | apply | rollback | verify");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("ERROR:", err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
