/**
 * Validación real (solo lectura) del módulo Calidad de Registro.
 *
 * Uso:
 *   npx tsx scripts/validar-calidad-registro.ts
 *
 * No escribe en la base de datos. Falla con exit code 1 si alguna
 * comprobación no se cumple.
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import {
  CATEGORIA_REGISTRADA_SQL,
  DOMINIO_FORMATO_SQL,
  DOMINIO_HOST_SQL,
  calidadRegistroRepository,
} from "../src/repositories/calidadRegistro.repository";
import { isValidDomainFormat } from "../src/domain/contacto/normalizacion";
import type {
  CalidadRegistroResponse,
  CalidadResumen,
} from "../src/types/calidadRegistro";

interface TotalesRow {
  total: number;
  cat_reg: number;
  cat_hom: number;
  dom_inf: number;
  dom_val: number;
  ambas: number;
  solo_cat: number;
  solo_dom: number;
  ninguna: number;
}

interface CanalRow extends TotalesRow {
  subcanal: string;
}

let failures = 0;
let checks = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

function pct(parte: number, total: number): number | null {
  if (!total) return null;
  return Math.round((parte / total) * 1000) / 10;
}

async function raw<T>(sql: Prisma.Sql): Promise<T[]> {
  return (await prisma.$queryRaw(sql)) as T[];
}

function buildConsolidadoSql(inicio: string, fin: string): Prisma.Sql {
  return Prisma.sql`
    WITH cat AS (
      SELECT DISTINCT normalizar_texto(categoria) AS clave
      FROM public.vw_homologacion_categorias
      WHERE categoria IS NOT NULL
    ),
    n AS (
      SELECT
        v.fecha, v.subcanal, v.ticket_id,
        ${CATEGORIA_REGISTRADA_SQL} AS cat_reg,
        c.clave AS cat_clave,
        CASE WHEN NULLIF(BTRIM(v.dominio), '') IS NOT NULL THEN 1 ELSE 0 END AS dom_inf,
        ${DOMINIO_HOST_SQL} AS host
      FROM public.v_unificado_norm v
      LEFT JOIN cat c ON c.clave = normalizar_texto(v.categoria)
      WHERE v.fecha >= ${inicio}::date AND v.fecha <= ${fin}::date
    ),
    b AS (
      SELECT *,
        CASE WHEN cat_reg = 1 AND cat_clave IS NOT NULL THEN 1 ELSE 0 END AS cat_hom,
        CASE WHEN dom_inf = 1 AND ${DOMINIO_FORMATO_SQL} THEN 1 ELSE 0 END AS dom_val
      FROM n
    ),
    e AS (
      SELECT *,
        CASE WHEN cat_hom = 1 AND dom_val = 1 THEN 1 ELSE 0 END AS ambas,
        CASE WHEN cat_hom = 1 AND dom_val = 0 THEN 1 ELSE 0 END AS solo_cat,
        CASE WHEN cat_hom = 0 AND dom_val = 1 THEN 1 ELSE 0 END AS solo_dom,
        CASE WHEN cat_hom = 0 AND dom_val = 0 THEN 1 ELSE 0 END AS ninguna
      FROM b
    ),
    k AS (
      SELECT *,
        CASE WHEN UPPER(BTRIM(subcanal)) = 'ZENDESK'
             THEN 'ZENDESK:' || ticket_id::text
             ELSE 'WA:' || ticket_id::text END AS atencion_key
      FROM e
    ),
    d AS (
      SELECT DISTINCT ON (atencion_key) *
      FROM k
      ORDER BY atencion_key, cat_hom DESC, dom_val DESC, cat_reg DESC, dom_inf DESC, fecha DESC, subcanal
    )
    SELECT
      count(*)::int AS total,
      COALESCE(sum(cat_reg), 0)::int AS cat_reg,
      COALESCE(sum(cat_hom), 0)::int AS cat_hom,
      COALESCE(sum(dom_inf), 0)::int AS dom_inf,
      COALESCE(sum(dom_val), 0)::int AS dom_val,
      COALESCE(sum(ambas), 0)::int AS ambas,
      COALESCE(sum(solo_cat), 0)::int AS solo_cat,
      COALESCE(sum(solo_dom), 0)::int AS solo_dom,
      COALESCE(sum(ninguna), 0)::int AS ninguna
    FROM d
  `;
}

function buildCanalSql(inicio: string, fin: string): Prisma.Sql {
  return Prisma.sql`
    WITH cat AS (
      SELECT DISTINCT normalizar_texto(categoria) AS clave
      FROM public.vw_homologacion_categorias
      WHERE categoria IS NOT NULL
    ),
    n AS (
      SELECT
        v.fecha, v.subcanal, v.ticket_id,
        ${CATEGORIA_REGISTRADA_SQL} AS cat_reg,
        c.clave AS cat_clave,
        CASE WHEN NULLIF(BTRIM(v.dominio), '') IS NOT NULL THEN 1 ELSE 0 END AS dom_inf,
        ${DOMINIO_HOST_SQL} AS host
      FROM public.v_unificado_norm v
      LEFT JOIN cat c ON c.clave = normalizar_texto(v.categoria)
      WHERE v.fecha >= ${inicio}::date AND v.fecha <= ${fin}::date
    ),
    b AS (
      SELECT *,
        CASE WHEN cat_reg = 1 AND cat_clave IS NOT NULL THEN 1 ELSE 0 END AS cat_hom,
        CASE WHEN dom_inf = 1 AND ${DOMINIO_FORMATO_SQL} THEN 1 ELSE 0 END AS dom_val
      FROM n
    ),
    e AS (
      SELECT *,
        CASE WHEN cat_hom = 1 AND dom_val = 1 THEN 1 ELSE 0 END AS ambas,
        CASE WHEN cat_hom = 1 AND dom_val = 0 THEN 1 ELSE 0 END AS solo_cat,
        CASE WHEN cat_hom = 0 AND dom_val = 1 THEN 1 ELSE 0 END AS solo_dom,
        CASE WHEN cat_hom = 0 AND dom_val = 0 THEN 1 ELSE 0 END AS ninguna
      FROM b
    )
    SELECT
      subcanal,
      count(*)::int AS total,
      COALESCE(sum(cat_reg), 0)::int AS cat_reg,
      COALESCE(sum(cat_hom), 0)::int AS cat_hom,
      COALESCE(sum(dom_inf), 0)::int AS dom_inf,
      COALESCE(sum(dom_val), 0)::int AS dom_val,
      COALESCE(sum(ambas), 0)::int AS ambas,
      COALESCE(sum(solo_cat), 0)::int AS solo_cat,
      COALESCE(sum(solo_dom), 0)::int AS solo_dom,
      COALESCE(sum(ninguna), 0)::int AS ninguna
    FROM e
    GROUP BY subcanal
    ORDER BY subcanal
  `;
}

function checkResumen(label: string, r: CalidadResumen): void {
  const c = r.categorizacion;
  const d = r.dominio;
  const i = r.integral;

  check(`${label}: catHomologadas <= catRegistradas`, c.homologadas <= c.registradas, `${c.homologadas} <= ${c.registradas}`);
  check(`${label}: catRegistradas <= total`, c.registradas <= r.total, `${c.registradas} <= ${r.total}`);
  check(`${label}: domValidos <= domInformados`, d.validos <= d.informados, `${d.validos} <= ${d.informados}`);
  check(`${label}: domInformados <= total`, d.informados <= r.total, `${d.informados} <= ${r.total}`);

  check(
    `${label}: registradas = homologadas + registradasNoHomologadas`,
    c.registradas === c.homologadas + c.registradasNoHomologadas,
    `${c.registradas} = ${c.homologadas} + ${c.registradasNoHomologadas}`,
  );
  check(
    `${label}: noHomologadasTotal = noRegistradas + registradasNoHomologadas`,
    c.noHomologadasTotal === c.noRegistradas + c.registradasNoHomologadas,
    `${c.noHomologadasTotal} = ${c.noRegistradas} + ${c.registradasNoHomologadas}`,
  );
  check(
    `${label}: informados = validos + informadosNoValidos`,
    d.informados === d.validos + d.informadosNoValidos,
    `${d.informados} = ${d.validos} + ${d.informadosNoValidos}`,
  );
  check(
    `${label}: noValidosTotal = noInformados + informadosNoValidos`,
    d.noValidosTotal === d.noInformados + d.informadosNoValidos,
    `${d.noValidosTotal} = ${d.noInformados} + ${d.informadosNoValidos}`,
  );

  check(
    `${label}: cumpleAmbas + soloCategoriaHomologada = homologadas`,
    i.cumpleAmbas + i.soloCategoriaHomologada === c.homologadas,
    `${i.cumpleAmbas} + ${i.soloCategoriaHomologada} = ${c.homologadas}`,
  );
  check(
    `${label}: cumpleAmbas + soloDominioValido = validos`,
    i.cumpleAmbas + i.soloDominioValido === d.validos,
    `${i.cumpleAmbas} + ${i.soloDominioValido} = ${d.validos}`,
  );
  const suma = i.cumpleAmbas + i.soloCategoriaHomologada + i.soloDominioValido + i.ningunaCondicion;
  check(`${label}: cuatro escenarios = total`, suma === r.total, `${suma} = ${r.total}`);

  check(`${label}: % registrada`, c.pctRegistrada === pct(c.registradas, r.total), `${c.pctRegistrada} vs ${pct(c.registradas, r.total)}`);
  check(`${label}: % homologada`, c.pctHomologada === pct(c.homologadas, r.total), `${c.pctHomologada} vs ${pct(c.homologadas, r.total)}`);
  check(`${label}: % informado`, d.pctInformado === pct(d.informados, r.total), `${d.pctInformado} vs ${pct(d.informados, r.total)}`);
  check(`${label}: % válido`, d.pctValido === pct(d.validos, r.total), `${d.pctValido} vs ${pct(d.validos, r.total)}`);
  check(`${label}: % integral`, i.pctCumplimientoIntegral === pct(i.cumpleAmbas, r.total), `${i.pctCumplimientoIntegral} vs ${pct(i.cumpleAmbas, r.total)}`);
}

async function main(): Promise<void> {
  const inicio = "2026-01-01";
  const fin = "2026-10-31";
  const filters = {
    fechaHoraInicio: `${inicio} 00:00`,
    fechaHoraFin: `${fin} 23:59`,
  };

  console.log("\n=== Validación Calidad de Registro ===");
  console.log(`Rango fijo: ${inicio} → ${fin}\n`);

  const data: CalidadRegistroResponse = await calidadRegistroRepository.obtener(filters, "mes");

  checkResumen("resumen actual", data.resumen.actual);
  if (data.resumen.anterior) checkResumen("resumen anterior", data.resumen.anterior);
  for (const p of data.evolucion) checkResumen(`evolución ${p.periodo}`, p);
  for (const c of data.comparativo) checkResumen(`canal ${c.canal}`, c);
  for (const f of data.tabla) checkResumen(`tabla ${f.periodo}/${f.canal}`, f);

  check(
    "evolución: suma de totales = resumen",
    data.evolucion.reduce((s, p) => s + p.total, 0) === data.resumen.actual.total,
    `${data.evolucion.reduce((s, p) => s + p.total, 0)} vs ${data.resumen.actual.total}`,
  );
  const todos = data.tabla.filter((f) => f.canal === "TODOS");
  check(
    "tabla TODOS: suma de totales = resumen",
    todos.reduce((s, f) => s + f.total, 0) === data.resumen.actual.total,
    `${todos.reduce((s, f) => s + f.total, 0)} vs ${data.resumen.actual.total}`,
  );

  // Comparación directa contra SQL para el consolidado.
  const directo = (await raw<TotalesRow>(buildConsolidadoSql(inicio, fin)))[0];
  check("SQL total consolidado", directo.total === data.resumen.actual.total, `${directo.total} vs ${data.resumen.actual.total}`);
  check("SQL cat registradas", directo.cat_reg === data.resumen.actual.categorizacion.registradas, `${directo.cat_reg} vs ${data.resumen.actual.categorizacion.registradas}`);
  check("SQL cat homologadas", directo.cat_hom === data.resumen.actual.categorizacion.homologadas, `${directo.cat_hom} vs ${data.resumen.actual.categorizacion.homologadas}`);
  check("SQL dom informados", directo.dom_inf === data.resumen.actual.dominio.informados, `${directo.dom_inf} vs ${data.resumen.actual.dominio.informados}`);
  check("SQL dom válidos", directo.dom_val === data.resumen.actual.dominio.validos, `${directo.dom_val} vs ${data.resumen.actual.dominio.validos}`);
  check("SQL cumple ambas", directo.ambas === data.resumen.actual.integral.cumpleAmbas, `${directo.ambas} vs ${data.resumen.actual.integral.cumpleAmbas}`);
  check("SQL solo categoría", directo.solo_cat === data.resumen.actual.integral.soloCategoriaHomologada, `${directo.solo_cat} vs ${data.resumen.actual.integral.soloCategoriaHomologada}`);
  check("SQL solo dominio", directo.solo_dom === data.resumen.actual.integral.soloDominioValido, `${directo.solo_dom} vs ${data.resumen.actual.integral.soloDominioValido}`);
  check("SQL ninguna", directo.ninguna === data.resumen.actual.integral.ningunaCondicion, `${directo.ninguna} vs ${data.resumen.actual.integral.ningunaCondicion}`);

  // Comparación por canal.
  const directoCanal = await raw<CanalRow>(buildCanalSql(inicio, fin));
  for (const c of data.comparativo) {
    const row = directoCanal.find((r) => r.subcanal === c.canal);
    check(`SQL canal ${c.canal} total`, row?.total === c.total, `${row?.total ?? "sin fila"} vs ${c.total}`);
    check(`SQL canal ${c.canal} cat registradas`, row?.cat_reg === c.categorizacion.registradas, `${row?.cat_reg ?? "sin fila"} vs ${c.categorizacion.registradas}`);
    check(`SQL canal ${c.canal} cat homologadas`, row?.cat_hom === c.categorizacion.homologadas, `${row?.cat_hom ?? "sin fila"} vs ${c.categorizacion.homologadas}`);
    check(`SQL canal ${c.canal} dom válidos`, row?.dom_val === c.dominio.validos, `${row?.dom_val ?? "sin fila"} vs ${c.dominio.validos}`);
  }

  // La regla barata de centinelas debe ser equivalente a la regla anterior con
  // normalizar_texto (sin acentos, espacios colapsados y _ -> espacio).
  const reglaAnterior = Prisma.sql`CASE
    WHEN v.categoria IS NULL OR BTRIM(v.categoria) = '' THEN 0
    WHEN normalizar_texto(v.categoria) = 'sin categoria en origen' THEN 0
    WHEN COALESCE(normalizar_texto(v.subcategoria), '') IN (
      '', 'sin categorizar', 'sin categoria', 'no categorizado',
      'no categorizada', 'sin clasificar', 'sin homologar',
      'sin asignar', 'sin definir', 'n a', 'na', 'sin dato', 'sin datos'
    ) THEN 0
    ELSE 1
  END`;
  const equivalencia = (
    await raw<{ diferencias: number }>(Prisma.sql`
      SELECT count(*) FILTER (
        WHERE (${CATEGORIA_REGISTRADA_SQL}) <> (${reglaAnterior})
      )::int AS diferencias
      FROM public.v_unificado_norm v
    `)
  )[0];
  check(
    "regla barata de categoría = regla con normalizar_texto",
    equivalencia?.diferencias === 0,
    `${equivalencia?.diferencias ?? "sin dato"} diferencias`,
  );

  // Regla SQL de dominio válido vs isValidDomainFormat.
  const dominios = await raw<{ dominio: string; sql_valido: boolean }>(Prisma.sql`
    WITH n AS (
      SELECT DISTINCT v.dominio, ${DOMINIO_HOST_SQL} AS host
      FROM public.v_unificado_norm v
      WHERE v.dominio IS NOT NULL
    )
    SELECT dominio, (host IS NOT NULL AND ${DOMINIO_FORMATO_SQL}) AS sql_valido
    FROM n
  `);
  const mismatches = dominios.filter((d) => isValidDomainFormat(d.dominio) !== d.sql_valido);
  check(
    "regla SQL de dominio = isValidDomainFormat",
    mismatches.length === 0,
    `${dominios.length} valores distintos, ${mismatches.length} discrepancias`,
  );
  if (mismatches.length) {
    console.log("  Ejemplos de discrepancia:", mismatches.slice(0, 10));
  }

  // Catálogo de homologación.
  const homologadas = await raw<{ categoria: string }>(Prisma.sql`
    SELECT DISTINCT v.categoria
    FROM public.v_unificado_norm v
    JOIN (
      SELECT DISTINCT normalizar_texto(categoria) AS clave
      FROM public.vw_homologacion_categorias
      WHERE categoria IS NOT NULL
    ) c ON c.clave = normalizar_texto(v.categoria)
    WHERE v.fecha >= ${inicio}::date AND v.fecha <= ${fin}::date
  `);
  const catalogo = await raw<{ categoria: string }>(Prisma.sql`
    SELECT DISTINCT categoria
    FROM public.vw_homologacion_categorias
    WHERE categoria IS NOT NULL
  `);
  const catalogoSet = new Set(catalogo.map((c) => c.categoria));
  const fueraCatalogo = homologadas.filter((h) => !catalogoSet.has(h.categoria));
  check(
    "categorías homologadas dentro del catálogo",
    fueraCatalogo.length === 0,
    `${homologadas.length} categorías distintas, ${fueraCatalogo.length} fuera del catálogo`,
  );
  check(
    "sin centinelas en categorías homologadas",
    !homologadas.some((h) => ["SIN HOMOLOGAR", "SIN CATEGORIA EN ORIGEN"].includes(h.categoria)),
    "SIN HOMOLOGAR y SIN CATEGORIA EN ORIGEN no deben aparecer",
  );

  // Consistencia entre granularidades.
  const [semana, mes, trimestre] = await Promise.all([
    calidadRegistroRepository.obtener(filters, "semana"),
    calidadRegistroRepository.obtener(filters, "mes"),
    calidadRegistroRepository.obtener(filters, "trimestre"),
  ]);
  check("total semanal = mensual", semana.resumen.actual.total === mes.resumen.actual.total, `${semana.resumen.actual.total} vs ${mes.resumen.actual.total}`);
  check("total mensual = trimestral", mes.resumen.actual.total === trimestre.resumen.actual.total, `${mes.resumen.actual.total} vs ${trimestre.resumen.actual.total}`);

  // Rango vacío.
  const vacio = await calidadRegistroRepository.obtener(
    { fechaHoraInicio: "2020-01-01 00:00", fechaHoraFin: "2020-01-31 23:59" },
    "mes",
  );
  check("rango vacío: total 0", vacio.resumen.actual.total === 0, `${vacio.resumen.actual.total}`);
  check("rango vacío: % null", vacio.resumen.actual.categorizacion.pctRegistrada === null, `${vacio.resumen.actual.categorizacion.pctRegistrada}`);
  check("rango vacío: evolución vacía", vacio.evolucion.length === 0, `${vacio.evolucion.length}`);
  check("rango vacío: tabla vacía", vacio.tabla.length === 0, `${vacio.tabla.length}`);

  // Rango anterior.
  if (data.rango.comparadoCon) {
    const prev = data.rango.comparadoCon;
    const previoDirecto = (await raw<TotalesRow>(buildConsolidadoSql(prev.inicio, prev.fin)))[0];
    check(
      "rango anterior: total",
      previoDirecto.total === data.resumen.anterior?.total,
      `${previoDirecto.total} vs ${data.resumen.anterior?.total}`,
    );
    check(
      "rango anterior: cat homologadas",
      previoDirecto.cat_hom === data.resumen.anterior?.categorizacion.homologadas,
      `${previoDirecto.cat_hom} vs ${data.resumen.anterior?.categorizacion.homologadas}`,
    );
  } else {
    check("rango anterior disponible", false, "No se calculó comparadoCon");
  }

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: backend y SQL coinciden.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
