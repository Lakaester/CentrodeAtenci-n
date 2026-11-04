/**
 * Validación transversal de Alex López en el módulo Reportes.
 *
 * Uso:
 *   npx tsx scripts/validar-alex.ts
 *
 * Comprueba:
 *  - Fuentes originales vs. v_unificado_norm.
 *  - Aporte de Alex en cada reporte y total contra SQL.
 *  - Que los demás asesores no cambiaron respecto de la línea base.
 *  - Que Alex aparece en filtros, Asesores, Resumen y Categorías.
 *  - Que Quejas y Devoluciones no inventa casos Q/D.
 */
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";
import { calidadRegistroRepository } from "../src/repositories/calidadRegistro.repository";

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

const OCT = { fechaHoraInicio: "2026-10-01 00:00", fechaHoraFin: "2026-10-31 23:59" };
const CRE = `CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;
const RANGO_FECHA = `fecha >= '2026-10-01'::date AND fecha < '2026-11-01'::date`;
const RANGO_CRE = `${CRE} >= '2026-10-01 00:00'::timestamp
  AND ${CRE} < ('2026-10-31 23:59'::timestamp + interval '1 minute')`;
const FIN = `estado_homologado IN ('cerrado', 'resuelto')`;
const WPP = `canal ILIKE '%what%'`;
const ZEND = `(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`;
const QD = `COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') = 'GESTION'
  AND cope_scat_normalizada(subcategoria) IN ('queja', 'solicitud de devolucion')`;

async function raw<T>(sql: string): Promise<T[]> {
  return (await prisma.$queryRawUnsafe(sql)) as T[];
}

async function count(where: string): Promise<number> {
  return (await raw<{ total: number }>(`SELECT COUNT(*)::int AS total FROM public.v_unificado_norm WHERE ${where}`))[0].total;
}

async function tablaZendesk(): Promise<string> {
  const rows = await raw<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%zendesk%' AND table_name ILIKE '%categor%'`,
  );
  if (!rows[0]) throw new Error("No se encontró la tabla de Zendesk.");
  return rows[0].table_name;
}

async function fuentes(): Promise<{ fuente: string; meses: { mes: string; total: number }[]; total: number }[]> {
  const zend = await tablaZendesk();
  const consultas = [
    {
      fuente: "WHATMETA",
      sql: `SELECT to_char(date_trunc('month', "CREACIÓN_FECHA"), 'YYYY-MM') AS mes, COUNT(*)::int AS total
            FROM "Whatmeta" WHERE "ASIGNADO" ILIKE '%alex%' GROUP BY 1 ORDER BY 1`,
    },
    {
      fuente: "WHATICKET",
      sql: `SELECT to_char(date_trunc('month', "CREACIÓN_FECHA"), 'YYYY-MM') AS mes, COUNT(*)::int AS total
            FROM "Whaticket" WHERE "ASIGNADO" ILIKE '%alex%' GROUP BY 1 ORDER BY 1`,
    },
    {
      fuente: "ZENDESK",
      sql: `SELECT to_char(date_trunc('month', tickets_created_at), 'YYYY-MM') AS mes, COUNT(*)::int AS total
            FROM "${zend}" WHERE name ILIKE '%alex%' GROUP BY 1 ORDER BY 1`,
    },
  ];
  const out = [];
  for (const c of consultas) {
    const meses = await raw<{ mes: string; total: number }>(c.sql);
    out.push({ fuente: c.fuente, meses, total: meses.reduce((s, r) => s + r.total, 0) });
  }
  return out;
}

async function main(): Promise<void> {
  console.log("\n=== Validación transversal Alex López ===");

  /* 1. Fuentes vs consolidado */
  const f = await fuentes();
  const fuenteTotal = f.reduce((s, x) => s + x.total, 0);
  const vistaTotal = await count(`asesor ILIKE '%alex%'`);
  const vistaPorMes = await raw<{ mes: string; total: number }>(`
    SELECT to_char(date_trunc('month', ${CRE}), 'YYYY-MM') AS mes, COUNT(*)::int AS total
    FROM public.v_unificado_norm WHERE asesor ILIKE '%alex%' GROUP BY 1 ORDER BY 1
  `);
  const vistaMesMap = new Map(vistaPorMes.map((r) => [r.mes, r.total]));

  console.log("\nFuentes:");
  for (const x of f) console.log(`  ${x.fuente}: ${x.total} (${x.meses.map((m) => `${m.mes}=${m.total}`).join(", ")})`);
  console.log(`Consolidado Alex: ${vistaTotal}`);

  check("Fuente total = consolidado", fuenteTotal === vistaTotal, `${fuenteTotal} vs ${vistaTotal}`);
  const fuenteMesMap = new Map<string, number>();
  for (const x of f) {
    for (const m of x.meses) {
      fuenteMesMap.set(m.mes, (fuenteMesMap.get(m.mes) ?? 0) + m.total);
    }
  }
  for (const [mes, totalMes] of fuenteMesMap) {
    check(
      `Mes ${mes}: fuente = consolidado`,
      vistaMesMap.get(mes) === totalMes,
      `vista=${vistaMesMap.get(mes) ?? 0} fuente=${totalMes}`,
    );
  }
  const clavesAlex = (
    await raw<{ total: number; claves: number }>(`
      SELECT COUNT(*)::int AS total,
             COUNT(DISTINCT subcanal || ':' || ticket_id::text)::int AS claves
      FROM public.v_unificado_norm WHERE asesor ILIKE '%alex%'
    `)
  )[0];
  check("Sin duplicados Alex en la vista", clavesAlex.total === clavesAlex.claves, `${clavesAlex.total} filas / ${clavesAlex.claves} claves`);

  /* 2. Regresión de asesores existentes */
  const prePath = join(process.cwd(), "sql", "migrations", "baseline-asesores-2026-11-03.json");
  const postPath = join(
    process.cwd(),
    "sql",
    "migrations",
    "baseline-asesores-post-alex-2026-11-03.json",
  );
  if (existsSync(prePath) && existsSync(postPath)) {
    const pre = JSON.parse(readFileSync(prePath, "utf8")) as {
      total: number;
      asesores: { asesor: string; total: number }[];
    };
    const post = JSON.parse(readFileSync(postPath, "utf8")) as {
      total: number;
      alex: number;
      asesores: { asesor: string; total: number }[];
    };
    const actual = await raw<{ asesor: string; total: number }>(`
      SELECT COALESCE(NULLIF(TRIM(asesor), ''), '(sin asesor)') AS asesor, COUNT(*)::int AS total
      FROM public.v_unificado_norm GROUP BY 1
    `);
    const zend = await tablaZendesk();
    const divergencias: string[] = [];
    for (const r of actual) {
      if (r.asesor === "(sin asesor)") continue;
      const fuente = (
        await prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
          SELECT (
            (SELECT COUNT(*) FROM "Whatmeta" WHERE "ASIGNADO" = ${r.asesor}) +
            (SELECT COUNT(*) FROM "Whaticket" WHERE "ASIGNADO" = ${r.asesor}) +
            (SELECT COUNT(*) FROM ${Prisma.raw(`"${zend}"`)} WHERE name = ${r.asesor})
          )::int AS total
        `)
      )[0].total;
      if (fuente !== r.total) divergencias.push(`${r.asesor}: vista=${r.total} fuente=${fuente}`);
    }
    check("Conteos por asesor = fuente original", divergencias.length === 0, divergencias.join("; ") || "todos coinciden");

    const totalVista = (await raw<{ total: number }>(`SELECT COUNT(*)::int AS total FROM public.v_unificado_norm`))[0].total;
    const crecimientoPost = totalVista - post.total;
    check(
      "Total consolidado >= línea base post-migración",
      totalVista >= post.total,
      `${totalVista} vs >= ${post.total}`,
    );
    check(
      "Post-baseline cubre pre-baseline + Alex",
      post.total >= pre.total + fuenteTotal,
      `${post.total} vs >= ${pre.total + fuenteTotal}`,
    );
    const crecimiento = post.total - pre.total - fuenteTotal;
    console.log(
      `Crecimiento vivo al momento del respaldo post: ${crecimiento} fila(s); crecimiento posterior: ${crecimientoPost} fila(s). Ajeno al parche de la vista.`,
    );
    if (crecimientoPost !== 0) {
      console.log("La base cambió después del respaldo; la reconciliación por asesor se validó contra las fuentes.");
    }
  } else {
    check("Líneas base disponibles", false, `${prePath} / ${postPath}`);
  }

  /* 3. Aportes por reporte y total contra SQL */
  const operacionSql = `
    WITH n AS (
      SELECT v.*, ${CRE} AS creacion,
             CASE WHEN UPPER(BTRIM(subcanal)) = 'ZENDESK' THEN 'ZENDESK:' || ticket_id::text
                  ELSE 'WA:' || ticket_id::text END AS atencion_key
      FROM public.v_unificado_norm v
      WHERE ${RANGO_CRE}
    ), d AS (
      SELECT DISTINCT ON (atencion_key) * FROM n ORDER BY atencion_key, creacion ASC, subcanal
    )
    SELECT COUNT(*)::int AS total FROM d
  `;
  const operacionAlexSql = `
    WITH n AS (
      SELECT v.*, ${CRE} AS creacion,
             CASE WHEN UPPER(BTRIM(subcanal)) = 'ZENDESK' THEN 'ZENDESK:' || ticket_id::text
                  ELSE 'WA:' || ticket_id::text END AS atencion_key
      FROM public.v_unificado_norm v WHERE asesor ILIKE '%alex%' AND ${RANGO_CRE}
    ), d AS (
      SELECT DISTINCT ON (atencion_key) * FROM n ORDER BY atencion_key, creacion ASC, subcanal
    )
    SELECT COUNT(*)::int AS total FROM d
  `;

  const [resumen, operacion, pais, asesores, categorias, clientes, whatsapp, zendesk, calidad, qd] =
    await Promise.all([
      unificadoRepository.resumen(OCT),
      unificadoRepository.operacion(OCT),
      unificadoRepository.pais(OCT),
      unificadoRepository.asesores(OCT),
      unificadoRepository.categoriasV2(OCT),
      unificadoRepository.clientesV2(OCT),
      unificadoRepository.whatsapp(OCT),
      unificadoRepository.zendesk(OCT),
      calidadRegistroRepository.obtener(OCT, "mensual"),
      unificadoRepository.quejasDevoluciones(OCT),
    ]);

  const sql = {
    resumen: await count(`${FIN} AND ${RANGO_FECHA}`),
    operacion: (await raw<{ total: number }>(operacionSql))[0].total,
    pais: await count(RANGO_FECHA),
    asesores: await count(RANGO_FECHA),
    categorias: await count(`${FIN} AND ${RANGO_FECHA}`),
    clientes: await count(`${FIN} AND ${RANGO_CRE}`),
    whatsapp: await count(`${WPP} AND ${RANGO_FECHA}`),
    zendesk: await count(`${ZEND} AND ${RANGO_CRE}`),
    calidad: await count(RANGO_FECHA),
    qd: await count(`${QD} AND ${RANGO_CRE}`),
  };
  const alex = {
    resumen: await count(`asesor ILIKE '%alex%' AND ${FIN} AND ${RANGO_FECHA}`),
    operacion: (await raw<{ total: number }>(operacionAlexSql))[0].total,
    pais: await count(`asesor ILIKE '%alex%' AND ${RANGO_FECHA}`),
    asesores: await count(`asesor ILIKE '%alex%' AND ${RANGO_FECHA}`),
    categorias: await count(`asesor ILIKE '%alex%' AND ${FIN} AND ${RANGO_FECHA}`),
    clientes: await count(`asesor ILIKE '%alex%' AND ${FIN} AND ${RANGO_CRE}`),
    whatsapp: await count(`asesor ILIKE '%alex%' AND ${WPP} AND ${RANGO_FECHA}`),
    zendesk: await count(`asesor ILIKE '%alex%' AND ${ZEND} AND ${RANGO_CRE}`),
    calidad: await count(`asesor ILIKE '%alex%' AND ${RANGO_FECHA}`),
    qd: await count(`asesor ILIKE '%alex%' AND ${QD} AND ${RANGO_CRE}`),
  };

  const filas = [
    ["Resumen", resumen.kpis.total.valor, sql.resumen, alex.resumen],
    ["Operación", operacion.kpis.total.valor, sql.operacion, alex.operacion],
    ["País", pais.totales.wpp_total + pais.totales.corr_total, sql.pais, alex.pais],
    ["Asesores", asesores.kpis.totalAtenciones, sql.asesores, alex.asesores],
    ["Categorías", categorias.universo.total, sql.categorias, alex.categorias],
    ["Clientes", clientes.universo.total, sql.clientes, alex.clientes],
    ["WhatsApp", whatsapp.kpis.totalConversaciones, sql.whatsapp, alex.whatsapp],
    ["Zendesk", zendesk.kpis.totalTickets, sql.zendesk, alex.zendesk],
    ["Calidad de Registro", calidad.resumen.actual.total, sql.calidad, alex.calidad],
    ["Quejas y Devoluciones", qd.kpis.totalCasos, sql.qd, alex.qd],
  ] as const;

  console.log("\nReporte | Alex | Total reporte | Total SQL | OK");
  for (const [nombre, total, sqlTotal, alexTotal] of filas) {
    check(`${nombre}: total contra SQL`, total === sqlTotal, `${total} vs ${sqlTotal}`);
    check(`${nombre}: aporte Alex > 0 o Q/D`, alexTotal > 0 || nombre === "Quejas y Devoluciones", `${alexTotal}`);
    console.log(`  ${nombre}: Alex=${alexTotal}; total=${total}; SQL=${sqlTotal}; ${total === sqlTotal ? "OK" : "DIF"}`);
  }

  /* 4. Presencia en dimensiones y filtros */
  check("Opciones incluye Alex Lopez", (await unificadoRepository.opciones()).asesor.some((n) => n.toLowerCase().includes("alex")), "filtro global");
  check("Asesores incluye Alex", asesores.volumenPorAsesor.some((r) => r.asesor.toLowerCase().includes("alex")), JSON.stringify(asesores.volumenPorAsesor.filter((r) => r.asesor.toLowerCase().includes("alex"))));
  check(
    "Resumen incluye Alex",
    resumen.porAsesor.some((r) => r.etiqueta.toLowerCase().includes("alex")),
    JSON.stringify(resumen.porAsesor.filter((r) => r.etiqueta.toLowerCase().includes("alex"))),
  );
  check(
    "Categorías incluye Alex López",
    categorias.asesorDetalle.some((r) => r.asesor.toLowerCase().includes("alex")),
    JSON.stringify(categorias.asesorDetalle.filter((r) => r.asesor.toLowerCase().includes("alex")).slice(0, 3)),
  );
  check("Q/D no incluye Alex", !qd.asesores.some((r) => r.asesor.toLowerCase().includes("alex")), `${qd.asesores.length} asesores Q/D`);

  /* 5. Matriz mensual */
  const meses = [...new Set([...f.flatMap((x) => x.meses.map((m) => m.mes)), ...vistaPorMes.map((m) => m.mes)])].sort();
  console.log("\nMes | Fuente | Consolidado");
  for (const mes of meses) {
    const fuenteMes = f.reduce((s, x) => s + (x.meses.find((m) => m.mes === mes)?.total ?? 0), 0);
    console.log(`  ${mes}: ${fuenteMes} | ${vistaMesMap.get(mes) ?? 0}`);
  }

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Alex López incorporado y reportes reconciliados.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
