/**
 * Validación real (solo lectura) del reporte Categorías.
 *
 * Universo: atenciones finalizadas (estado_homologado IN ('cerrado','resuelto')).
 * Cada comprobación se contrasta con SQL independiente sobre v_unificado_norm.
 *
 * Uso:
 *   npx tsx scripts/validar-categorias.ts
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";
import { consolidarAsesor } from "../src/utils/asesorEquivalencias";

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

const FIN = Prisma.sql`estado_homologado IN ('cerrado', 'resuelto')`;
const CAT = Prisma.sql`COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría')`;
const SCAT_KEY = Prisma.sql`cope_scat_normalizada(subcategoria)`;

const TECNICAS = ["SIN HOMOLOGAR", "SIN CATEGORIA EN ORIGEN", "SIN CATEGORÍA EN ORIGEN"];

const UMBRAL = Prisma.sql`CASE
  WHEN canal ILIKE '%what%' THEN 120
  WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN 1440
  ELSE 480
END`;

async function raw<T>(sql: Prisma.Sql): Promise<T[]> {
  return (await prisma.$queryRaw(sql)) as T[];
}

const suma = (rows: { volumen: number }[]) => rows.reduce((s, r) => s + r.volumen, 0);
const cerca = (a: number | null, b: number | null) =>
  a !== null && b !== null && Math.abs(a - b) < 0.11;

async function main(): Promise<void> {
  console.log("\n=== Validación Reporte Categorías ===");

  const t0 = Date.now();
  const data = await unificadoRepository.categoriasV2({});
  const ms = Date.now() - t0;
  console.log(`Tiempo de respuesta del repositorio: ${ms} ms`);

  const total = data.universo.total;

  /* ── Universo ── */
  const universo = (
    await raw<{ total_rango: number; total: number; abiertas: number; sin_estado: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total_rango,
             COUNT(*) FILTER (WHERE ${FIN})::int AS total,
             COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
             COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_estado
      FROM public.v_unificado_norm
    `)
  )[0];

  check("Universo total finalizadas", total === universo.total, `${total} vs ${universo.total}`);
  check("Universo total del rango", data.universo.totalRango === universo.total_rango, `${data.universo.totalRango} vs ${universo.total_rango}`);
  check("Excluidas = rango - finalizadas", data.universo.excluidas === universo.total_rango - universo.total, `${data.universo.excluidas}`);
  check("Abiertas", data.universo.abiertas === universo.abiertas, `${data.universo.abiertas} vs ${universo.abiertas}`);
  check("Sin estado homologado", data.universo.sinEstado === universo.sin_estado, `${data.universo.sinEstado} vs ${universo.sin_estado}`);
  check("Excluidas = abiertas + sin estado", data.universo.excluidas === universo.abiertas + universo.sin_estado, `${data.universo.excluidas}`);
  check("Fuera de finalizadas = 0", (await raw<{ n: number }>(Prisma.sql`
    SELECT COUNT(*)::int AS n FROM public.v_unificado_norm
    WHERE NOT (${FIN})
  `))[0].n === universo.total_rango - universo.total, "consistente");

  /* ── Catálogo ── */
    const catalogo = (
    await raw<{ categorias: number; subcategorias: number }>(Prisma.sql`
      SELECT COUNT(DISTINCT ${CAT})::int AS categorias,
             COUNT(DISTINCT COALESCE(NULLIF(INITCAP(${SCAT_KEY}), ''), 'Sin subcategoría'))::int AS subcategorias
      FROM public.v_unificado_norm WHERE ${FIN}
    `)
  )[0];
  check("Total categorías", data.totalCategorias === catalogo.categorias, `${data.totalCategorias} vs ${catalogo.categorias}`);
  check("Total subcategorías", data.totalSubcategorias === catalogo.subcategorias, `${data.totalSubcategorias} vs ${catalogo.subcategorias}`);

  /* ── Pareto categorías ── */
  const sumaPareto = suma(data.paretoCategorias);
  check("Pareto categorías suma el total", sumaPareto === total, `${sumaPareto} vs ${total}`);
  check(
    "Pareto categorías termina en 100%",
    cerca(data.paretoCategorias.at(-1)?.acumulado ?? null, 100),
    `${data.paretoCategorias.at(-1)?.acumulado}%`,
  );
  const cruce80 = data.paretoCategorias.find((r) => r.acumulado >= 80);
  check("Pareto categorías cruza el 80%", !!cruce80, cruce80 ? `${cruce80.categoria} · ${cruce80.acumulado}%` : "sin cruce");

  /* ── Pareto subcategorías ── */
  const sumaSub = suma(data.paretoSubcategorias);
  check("Pareto subcategorías suma el total", sumaSub === total, `${sumaSub} vs ${total}`);
  const subPorCat = new Map<string, number>();
  for (const r of data.paretoSubcategorias) {
    subPorCat.set(r.categoria, (subPorCat.get(r.categoria) ?? 0) + r.volumen);
  }
  let subOk = true;
  let subDetalle = "";
  for (const cat of data.paretoCategorias) {
    const s = subPorCat.get(cat.categoria) ?? 0;
    if (s !== cat.volumen) {
      subOk = false;
      subDetalle = `${cat.categoria}: ${s} vs ${cat.volumen}`;
      break;
    }
  }
  check("Subcategorías por categoría = Pareto", subOk, subDetalle || "todas coinciden");

  /* ── Jerarquía ── */
  const sumaJer = suma(data.jerarquia);
  check("Jerarquía suma el total", sumaJer === total, `${sumaJer} vs ${total}`);
  const jerPorCat = new Map<string, number>();
  for (const r of data.jerarquia) {
    jerPorCat.set(r.categoria, (jerPorCat.get(r.categoria) ?? 0) + r.volumen);
  }
  let jerOk = true;
  let jerDetalle = "";
  for (const cat of data.paretoCategorias) {
    const j = jerPorCat.get(cat.categoria) ?? 0;
    if (j !== cat.volumen) {
      jerOk = false;
      jerDetalle = `${cat.categoria}: ${j} vs ${cat.volumen}`;
      break;
    }
  }
  check("Jerarquía por categoría = Pareto", jerOk, jerDetalle || "todas coinciden");

  /* ── Tiempo ── */
  const sumaTiempo = suma(data.categoriasTiempo);
  check("Tiempo suma el total", sumaTiempo === total, `${sumaTiempo} vs ${total}`);
  const tiempoSql = (
    await raw<{ con_dato: number }>(Prisma.sql`
      SELECT COUNT(resolucion_min_norm)::int AS con_dato
      FROM public.v_unificado_norm WHERE ${FIN}
    `)
  )[0];
  const sumaConDato = data.categoriasTiempo.reduce((s, r) => s + r.conDato, 0);
  check("Tiempo: evaluables", sumaConDato === tiempoSql.con_dato, `${sumaConDato} vs ${tiempoSql.con_dato}`);

  /* ── SLA ── */
  const sumaSla = suma(data.categoriasSLA);
  check("SLA suma el total", sumaSla === total, `${sumaSla} vs ${total}`);
  const totalConDato = data.categoriasSLA.reduce((s, r) => s + r.conDato, 0);
  const totalCumple = data.categoriasSLA.reduce((s, r) => s + r.cumple, 0);
  const totalNoCumple = data.categoriasSLA.reduce((s, r) => s + r.noCumple, 0);
  check("SLA: evaluables", totalConDato === tiempoSql.con_dato, `${totalConDato} vs ${tiempoSql.con_dato}`);
  check("SLA: cumple + noCumple = evaluables", totalCumple + totalNoCumple === totalConDato, `${totalCumple} + ${totalNoCumple} = ${totalConDato}`);

  const slaSql = (
    await raw<{ con_dato: number; cumple: number }>(Prisma.sql`
      SELECT COUNT(resolucion_min_norm)::int AS con_dato,
             COUNT(*) FILTER (
               WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${UMBRAL}
             )::int AS cumple
      FROM public.v_unificado_norm WHERE ${FIN}
    `)
  )[0];
  check("SLA: cumple contra SQL", totalCumple === slaSql.cumple, `${totalCumple} vs ${slaSql.cumple}`);
  check("SLA: no cumple contra SQL", totalNoCumple === slaSql.con_dato - slaSql.cumple, `${totalNoCumple} vs ${slaSql.con_dato - slaSql.cumple}`);

  let slaFilaOk = true;
  let slaFilaDetalle = "";
  for (const r of data.categoriasSLA) {
    if (r.cumple + r.noCumple !== r.conDato) {
      slaFilaOk = false;
      slaFilaDetalle = `${r.categoria}: ${r.cumple}+${r.noCumple} vs ${r.conDato}`;
      break;
    }
    const pct = r.conDato > 0 ? Math.round((r.noCumple / r.conDato) * 1000) / 10 : null;
    if (!cerca(pct, r.pctIncumple)) {
      slaFilaOk = false;
      slaFilaDetalle = `${r.categoria}: ${r.pctIncumple} vs ${pct}`;
      break;
    }
  }
  check("SLA: composición y % por categoría", slaFilaOk, slaFilaDetalle || "todas coinciden");
  check("SLA: metas por canal", data.slaMetas.whatsapp === 120 && data.slaMetas.correo === 1440 && data.slaMetas.otro === 480, JSON.stringify(data.slaMetas));

  /* ── Asesores ── */
  const sumaAsesor = suma(data.asesorDetalle);
  check("Asesor detalle suma el total", sumaAsesor === total, `${sumaAsesor} vs ${total}`);
  const sumaTraz = suma(data.asesorTrazabilidad);
  check("Trazabilidad suma el total", sumaTraz === total, `${sumaTraz} vs ${total}`);
  check("Originales distintos", data.asesorTrazabilidad.length === 16, `${data.asesorTrazabilidad.length}`);
  const consolidados = new Set(data.asesorTrazabilidad.map((r) => r.consolidado));
  check("Consolidados distintos", consolidados.size === 8, `${consolidados.size}: ${[...consolidados].join(", ")}`);
  check("Sin asignar = 0", data.totalSinAsesor === 0, `${data.totalSinAsesor}`);

  let equivalenciaOk = true;
  let equivalenciaDetalle = "";
  for (const r of data.asesorTrazabilidad) {
    if (consolidarAsesor(r.original) !== r.consolidado) {
      equivalenciaOk = false;
      equivalenciaDetalle = `${r.original} → ${r.consolidado}`;
      break;
    }
  }
  check("Equivalencias determinísticas", equivalenciaOk, equivalenciaDetalle || "16/16 correctas");

  const asesorSql = (
    await raw<{ originales: number }>(Prisma.sql`
      SELECT COUNT(DISTINCT COALESCE(NULLIF(TRIM(asesor), ''), 'Sin asignar'))::int AS originales
      FROM public.v_unificado_norm WHERE ${FIN}
    `)
  )[0];
  check("Originales contra SQL", data.asesorTrazabilidad.length === asesorSql.originales, `${data.asesorTrazabilidad.length} vs ${asesorSql.originales}`);

  /* ── Categorías técnicas ── */
  const tecnicas = data.paretoCategorias.filter((r) => r.tecnica);
  const subtotalTecnicas = tecnicas.reduce((s, r) => s + r.volumen, 0);
  const tecnicasSql = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${FIN} AND UPPER(${CAT}) = ANY(ARRAY['SIN HOMOLOGAR','SIN CATEGORIA EN ORIGEN','SIN CATEGORÍA EN ORIGEN']::text[])
    `)
  )[0];
  check("Subtotal categorías técnicas", subtotalTecnicas === tecnicasSql.total, `${subtotalTecnicas} vs ${tecnicasSql.total}`);
  check("Categorías técnicas identificadas", tecnicas.length === 2, tecnicas.map((r) => `${r.categoria}:${r.volumen}`).join(", "));

  /* ── Duplicados entre canales (documentados, no deduplicados) ── */
  const dups = (
    await raw<{ n: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS n FROM (
        SELECT ticket_id FROM public.v_unificado_norm WHERE ${FIN}
        GROUP BY ticket_id HAVING COUNT(DISTINCT subcanal) > 1
      ) x
    `)
  )[0];
  check("Tickets en más de un canal (documentados)", dups.n === 2, `${dups.n}`);

  /* ── Filtros globales ── */
  const filtro = { categoria: ["FACTURACION ELECTRONICA"] };
  const dataFiltro = await unificadoRepository.categoriasV2(filtro);
  const totalFiltroSql = (
    await raw<{ n: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS n FROM public.v_unificado_norm
      WHERE ${FIN} AND categoria = ANY(ARRAY['FACTURACION ELECTRONICA']::text[])
    `)
  )[0];
  check("Filtro categoría: total", dataFiltro.universo.total === totalFiltroSql.n, `${dataFiltro.universo.total} vs ${totalFiltroSql.n}`);
  check("Filtro categoría: Pareto = total", suma(dataFiltro.paretoCategorias) === dataFiltro.universo.total, `${suma(dataFiltro.paretoCategorias)} vs ${dataFiltro.universo.total}`);
  check("Filtro categoría: subcategorías = total", suma(dataFiltro.paretoSubcategorias) === dataFiltro.universo.total, `${suma(dataFiltro.paretoSubcategorias)} vs ${dataFiltro.universo.total}`);
  check("Filtro categoría: asesores = total", suma(dataFiltro.asesorDetalle) === dataFiltro.universo.total, `${suma(dataFiltro.asesorDetalle)} vs ${dataFiltro.universo.total}`);
  check("Filtro categoría: jerarquía = total", suma(dataFiltro.jerarquia) === dataFiltro.universo.total, `${suma(dataFiltro.jerarquia)} vs ${dataFiltro.universo.total}`);

  const filtroSub = await unificadoRepository.categoriasV2({
    categoria: ["FACTURACION ELECTRONICA"],
    subcategoria: ["ajustes fe"],
  });
  check("Filtro categoría + subcategoría: Pareto = total", suma(filtroSub.paretoCategorias) === filtroSub.universo.total, `${suma(filtroSub.paretoCategorias)} vs ${filtroSub.universo.total}`);

  /* ── Rango de fechas: la ruta sargable debe dar el mismo total ── */
  const rangos = [
    { nombre: "día completo", inicio: "2026-11-01 00:00", fin: "2026-11-03 23:59" },
    { nombre: "rango parcial", inicio: "2026-11-01 08:30", fin: "2026-11-03 17:45" },
    { nombre: "un solo día", inicio: "2026-11-02 00:00", fin: "2026-11-02 23:59" },
  ];
  for (const r of rangos) {
    const d = await unificadoRepository.categoriasV2({
      fechaHoraInicio: r.inicio,
      fechaHoraFin: r.fin,
    });
    const sql = (
      await raw<{ n: number }>(Prisma.sql`
        SELECT COUNT(*)::int AS n FROM public.v_unificado_norm
        WHERE ${FIN}
          AND (fecha::date + hora::time) >= ${r.inicio}::timestamp
          AND (fecha::date + hora::time) <= ${r.fin}::timestamp
      `)
    )[0];
    check(
      `Rango ${r.nombre}: total`,
      d.universo.total === sql.n,
      `${d.universo.total} vs ${sql.n}`,
    );
    check(
      `Rango ${r.nombre}: Pareto = total`,
      suma(d.paretoCategorias) === d.universo.total,
      `${suma(d.paretoCategorias)} vs ${d.universo.total}`,
    );
  }

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Categorías y SQL coinciden.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
