/**
 * Validación real (solo lectura) del reporte Resumen.
 *
 * Uso:
 *   npx tsx scripts/validar-resumen.ts
 *
 * Comprueba que el endpoint use el universo de atenciones finalizadas
 * (cerrado + resuelto), que los promedios ignoren tiempos nulos y que
 * detalle, distribución, país, categoría y ranking sean consistentes.
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import {
  SLA_MINUTOS,
  unificadoRepository,
} from "../src/repositories/unificado.repository";

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

async function raw<T>(sql: Prisma.Sql): Promise<T[]> {
  return (await prisma.$queryRaw(sql)) as T[];
}

const UMBRAL_PR = Prisma.sql`
  CASE
    WHEN canal ILIKE '%what%' THEN ${SLA_MINUTOS.primeraRespuesta.whatsapp}
    WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN ${SLA_MINUTOS.primeraRespuesta.correo}
    ELSE ${SLA_MINUTOS.primeraRespuesta.otro}
  END`;
const UMBRAL_RES = Prisma.sql`
  CASE
    WHEN canal ILIKE '%what%' THEN ${SLA_MINUTOS.resolucion.whatsapp}
    WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN ${SLA_MINUTOS.resolucion.correo}
    ELSE ${SLA_MINUTOS.resolucion.otro}
  END`;

const FINAL = Prisma.sql`estado_homologado IN ('cerrado', 'resuelto')`;

interface DirectTotales {
  total: number;
  pr_con: number;
  pr_dentro: number;
  res_con: number;
  res_dentro: number;
  prom_pr: number | null;
  prom_res: number | null;
}

async function directTotales(where: Prisma.Sql): Promise<DirectTotales> {
  const rows = await raw<DirectTotales>(Prisma.sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS pr_con,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                        AND primera_respuesta_min_norm <= ${UMBRAL_PR})::int AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS res_con,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL
                        AND resolucion_min_norm <= ${UMBRAL_RES})::int AS res_dentro,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS prom_pr,
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS prom_res
    FROM public.v_unificado_norm
    WHERE estado_homologado IN ('cerrado', 'resuelto')
    ${where}
  `);
  return rows[0];
}

const pct = (dentro: number, con: number) =>
  con > 0 ? Math.round((dentro / con) * 1000) / 10 : null;

async function main(): Promise<void> {
  console.log("\n=== Validación Reporte Resumen ===");

  // 1. Universo completo (sin fechas) para contrastar la línea base.
  const data = await unificadoRepository.resumen({});
  const direct = await directTotales(Prisma.empty);
  const k = data.kpis;

  console.log(`Línea base esperada: 22,765 finalizadas. Actual: ${k.total.valor}.`);
  check("KPI total vs SQL finalizado", k.total.valor === direct.total, `${k.total.valor} vs ${direct.total}`);
  console.log(
    k.total.valor === 22765
      ? "  → La línea base de 22,765 coincide con el universo actual."
      : "  → La línea base cambió por nuevas atenciones o cambios legítimos en los datos; el KPI y SQL siguen coincidiendo.",
  );

  check("KPI primera con dato", k.primeraConDato.valor === direct.pr_con, `${k.primeraConDato.valor} vs ${direct.pr_con}`);
  check("KPI primera dentro", k.primeraDentro.valor === direct.pr_dentro, `${k.primeraDentro.valor} vs ${direct.pr_dentro}`);
  check("KPI primera fuera", k.primeraFuera.valor === direct.pr_con - direct.pr_dentro, `${k.primeraFuera.valor} vs ${direct.pr_con - direct.pr_dentro}`);
  check(
    "KPI % primera",
    k.cumplimientoPrimeraPct.valor === pct(direct.pr_dentro, direct.pr_con),
    `${k.cumplimientoPrimeraPct.valor} vs ${pct(direct.pr_dentro, direct.pr_con)}`,
  );
  check("KPI resolución con dato", k.resolucionConDato.valor === direct.res_con, `${k.resolucionConDato.valor} vs ${direct.res_con}`);
  check("KPI resolución dentro", k.resolucionDentro.valor === direct.res_dentro, `${k.resolucionDentro.valor} vs ${direct.res_dentro}`);
  check("KPI resolución fuera", k.resolucionFuera.valor === direct.res_con - direct.res_dentro, `${k.resolucionFuera.valor} vs ${direct.res_con - direct.res_dentro}`);
  check(
    "KPI % resolución",
    k.cumplimientoResolucionPct.valor === pct(direct.res_dentro, direct.res_con),
    `${k.cumplimientoResolucionPct.valor} vs ${pct(direct.res_dentro, direct.res_con)}`,
  );
  check(
    "Promedio 1ª respuesta ignora nulos",
    k.promPrimeraRespMin.valor === direct.prom_pr,
    `${k.promPrimeraRespMin.valor} vs ${direct.prom_pr}`,
  );
  check(
    "Promedio resolución ignora nulos",
    k.promResolucionMin.valor === direct.prom_res,
    `${k.promResolucionMin.valor} vs ${direct.prom_res}`,
  );

  // 2. Distribución por subcanal y tiempos.
  const directSub = await raw<{ subcanal: string; total: number; prom_pr: number | null; prom_res: number | null }>(Prisma.sql`
    SELECT subcanal, COUNT(*)::int AS total,
           ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS prom_pr,
           ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS prom_res
    FROM public.v_unificado_norm
    WHERE estado_homologado IN ('cerrado', 'resuelto')
    GROUP BY subcanal
  `);
  const subMap = new Map(directSub.map((r) => [r.subcanal, r]));
  check(
    "Distribución por subcanal suma el total",
    data.porSubcanal.reduce((s, r) => s + r.total, 0) === direct.total,
    `${data.porSubcanal.reduce((s, r) => s + r.total, 0)} vs ${direct.total}`,
  );
  for (const t of data.tiemposPorCanal) {
    const d = subMap.get(t.etiqueta);
    check(`Tiempos ${t.etiqueta} total`, t.total === d?.total, `${t.total} vs ${d?.total}`);
    check(`Tiempos ${t.etiqueta} 1ª respuesta`, t.promPrimera === d?.prom_pr, `${t.promPrimera} vs ${d?.prom_pr}`);
    check(`Tiempos ${t.etiqueta} resolución`, t.promResolucion === d?.prom_res, `${t.promResolucion} vs ${d?.prom_res}`);
  }

  // 3. País y categoría.
  check(
    "País suma el total finalizado",
    data.porPais.reduce((s, r) => s + r.total, 0) === direct.total,
    `${data.porPais.reduce((s, r) => s + r.total, 0)} vs ${direct.total}`,
  );
  const topPais = await raw<{ etiqueta: string; total: number }>(Prisma.sql`
    SELECT COALESCE(INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')), 'Sin país') AS etiqueta,
           COUNT(*)::int AS total
    FROM public.v_unificado_norm
    WHERE estado_homologado IN ('cerrado', 'resuelto')
    GROUP BY 1 ORDER BY total DESC LIMIT 1
  `);
  check(
    "País líder",
    data.porPais[0]?.etiqueta === topPais[0]?.etiqueta && data.porPais[0]?.total === topPais[0]?.total,
    `${data.porPais[0]?.etiqueta} ${data.porPais[0]?.total} vs ${topPais[0]?.etiqueta} ${topPais[0]?.total}`,
  );

  const topCat = await raw<{ etiqueta: string; total: number }>(Prisma.sql`
    SELECT COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') AS etiqueta,
           COUNT(*)::int AS total
    FROM public.v_unificado_norm
    WHERE estado_homologado IN ('cerrado', 'resuelto')
    GROUP BY 1 ORDER BY total DESC LIMIT 1
  `);
  check(
    "Categoría líder",
    data.topCategorias[0]?.etiqueta === topCat[0]?.etiqueta && data.topCategorias[0]?.total === topCat[0]?.total,
    `${data.topCategorias[0]?.etiqueta} ${data.topCategorias[0]?.total} vs ${topCat[0]?.etiqueta} ${topCat[0]?.total}`,
  );

  // 4. Estado: el resumen solo debe mostrar finalizados.
  check(
    "porEstado solo contiene cerrado/resuelto",
    data.porEstado.every((e) => ["cerrado", "resuelto"].includes(e.etiqueta)),
    data.porEstado.map((e) => e.etiqueta).join(", "),
  );

  // 5. Ranking finalizado y cumplimiento de resolución.
  check("Ranking máximo 3", data.topAsesores.length <= 3, `${data.topAsesores.length}`);
  for (const a of data.topAsesores) {
    check(`Ranking ${a.asesor} mínimo 5`, a.total >= 5, `${a.total}`);
    check(
      `Ranking ${a.asesor} % resolución en rango`,
      a.cumpleResolucionPct === null || (a.cumpleResolucionPct >= 0 && a.cumpleResolucionPct <= 100),
      `${a.cumpleResolucionPct}`,
    );
  }

  // 6. Detalle finalizado y contraste con el endpoint sin universo.
  const detalleFinal = await unificadoRepository.detalle({ universo: "final", pagina: 1, limite: 1 });
  const detalleTodos = await unificadoRepository.detalle({ pagina: 1, limite: 1 });
  check(
    "Detalle final = KPI total",
    detalleFinal.total === k.total.valor,
    `${detalleFinal.total} vs ${k.total.valor}`,
  );
  check(
    "Detalle sin universo incluye más registros",
    detalleTodos.total > detalleFinal.total,
    `${detalleTodos.total} vs ${detalleFinal.total}`,
  );

  // 6b. Filtro por subcanal.
  const dataCanal = await unificadoRepository.resumen({ subcanal: ["WHATMETA"] });
  const directCanal = await directTotales(Prisma.sql`AND subcanal = 'WHATMETA'`);
  check(
    "Filtro subcanal: total",
    dataCanal.kpis.total.valor === directCanal.total,
    `${dataCanal.kpis.total.valor} vs ${directCanal.total}`,
  );
  check(
    "Filtro subcanal: una sola fila de tiempos",
    dataCanal.tiemposPorCanal.length === 1 &&
      dataCanal.tiemposPorCanal[0]?.etiqueta === "WHATMETA",
    dataCanal.tiemposPorCanal.map((t) => t.etiqueta).join(", "),
  );
  check(
    "Filtro subcanal: una sola distribución",
    dataCanal.porSubcanal.length === 1 && dataCanal.porSubcanal[0]?.etiqueta === "WHATMETA",
    dataCanal.porSubcanal.map((t) => t.etiqueta).join(", "),
  );

  // 7. Rango con comparación contra periodo anterior.
  const rango = { fechaHoraInicio: "2026-01-01 00:00", fechaHoraFin: "2026-10-31 23:59" };
  const dataRango = await unificadoRepository.resumen(rango);
  const directRango = await directTotales(
    Prisma.sql`AND fecha >= ${"2026-01-01"}::date AND fecha <= ${"2026-10-31"}::date`,
  );
  check(
    "Rango: total finalizado",
    dataRango.kpis.total.valor === directRango.total,
    `${dataRango.kpis.total.valor} vs ${directRango.total}`,
  );
  check(
    "Rango anterior disponible",
    dataRango.rango?.comparadoCon != null,
    dataRango.rango?.comparadoCon
      ? `${dataRango.rango.comparadoCon.inicio} → ${dataRango.rango.comparadoCon.fin}`
      : "sin comparadoCon",
  );
  if (dataRango.rango?.comparadoCon) {
    const prev = dataRango.rango.comparadoCon;
    const directPrev = await directTotales(
      Prisma.sql`AND fecha >= ${prev.inicio}::date AND fecha <= ${prev.fin}::date`,
    );
    check(
      "Rango: anterior coincide con SQL",
      dataRango.kpis.total.anterior === directPrev.total,
      `${dataRango.kpis.total.anterior} vs ${directPrev.total}`,
    );
  }

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Resumen, detalle y SQL coinciden.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
