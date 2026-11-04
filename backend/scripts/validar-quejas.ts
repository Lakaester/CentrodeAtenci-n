/**
 * Validación SQL independiente del reporte Quejas y Devoluciones.
 *
 * Uso:
 *   npx tsx scripts/validar-quejas.ts
 *
 * Comprueba universo por fecha real de creación, tipos, estados, canales,
 * tiempos con cobertura, evolución, asesores y ausencia de métricas retiradas.
 */
import "dotenv/config";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

const cerca = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && Math.abs(a - b) < 0.11;

const CRE = `CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;
const FILTRO = `COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') = 'GESTION'
  AND cope_scat_normalizada(subcategoria) IN ('queja', 'solicitud de devolucion')`;
const RANGO = `${CRE} >= '2026-10-01 00:00'::timestamp
  AND ${CRE} < ('2026-10-31 23:59'::timestamp + interval '1 minute')`;

async function raw<T>(sql: string): Promise<T[]> {
  return (await prisma.$queryRawUnsafe(sql)) as T[];
}

function numeroInvalido(value: unknown): boolean {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(numeroInvalido);
  if (value && typeof value === "object") {
    return Object.values(value).some(numeroInvalido);
  }
  return false;
}

async function main(): Promise<void> {
  console.log("\n=== Validación Quejas y Devoluciones ===");
  const t0 = Date.now();
  const s = await unificadoRepository.quejasDevoluciones({
    fechaHoraInicio: "2026-10-01 00:00",
    fechaHoraFin: "2026-10-31 23:59",
  });
  console.log(`Tiempo del repositorio: ${Date.now() - t0} ms`);

  const total = s.kpis.totalCasos;

  /* ── Universo y tipos ── */
  const base = (
    await raw<{
      total: number;
      quejas: number;
      devoluciones: number;
      primera_n: number;
      resolucion_n: number;
      resolucion_excluidas: number;
      primera_med: number | null;
      primera_p90: number | null;
      primera_prom: number | null;
      resolucion_med: number | null;
      resolucion_p90: number | null;
      resolucion_prom: number | null;
    }>(`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE cope_scat_normalizada(subcategoria) = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE cope_scat_normalizada(subcategoria) = 'solicitud de devolucion')::int AS devoluciones,
             COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS primera_n,
             COUNT(*) FILTER (
               WHERE resolucion_min_norm IS NOT NULL
                 AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
             )::int AS resolucion_n,
             COUNT(*) FILTER (
               WHERE resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL
             )::int AS resolucion_excluidas,
             ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_med,
             ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_p90,
             ROUND((AVG(primera_respuesta_min_norm) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_prom,
             ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (WHERE resolucion_min_norm IS NOT NULL AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)))::numeric, 1)::float8 AS resolucion_med,
             ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (WHERE resolucion_min_norm IS NOT NULL AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)))::numeric, 1)::float8 AS resolucion_p90,
             ROUND((AVG(resolucion_min_norm) FILTER (WHERE resolucion_min_norm IS NOT NULL AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)))::numeric, 1)::float8 AS resolucion_prom
      FROM public.v_unificado_norm
      WHERE ${RANGO} AND ${FILTRO}
    `)
  )[0];

  check("Puerta 1: total = quejas + devoluciones", s.kpis.totalCasos === s.kpis.quejas + s.kpis.devoluciones, `${total} vs ${s.kpis.quejas}+${s.kpis.devoluciones}`);
  check("Puerta 1: total contra SQL por creación", total === base.total, `${total} vs ${base.total}`);
  check("Puerta 1: quejas contra SQL", s.kpis.quejas === base.quejas, `${s.kpis.quejas} vs ${base.quejas}`);
  check("Puerta 1: devoluciones contra SQL", s.kpis.devoluciones === base.devoluciones, `${s.kpis.devoluciones} vs ${base.devoluciones}`);
  check("Puerta 1: porcentaje de quejas", cerca(s.kpis.pctQuejas, Math.round((base.quejas / base.total) * 1000) / 10), `${s.kpis.pctQuejas}%`);

  const porFecha = (
    await raw<{ total: number }>(`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE fecha >= '2026-10-01'::date AND fecha < '2026-11-01'::date AND ${FILTRO}
    `)
  )[0].total;
  console.log(`Universo por creación: ${total}; por fecha de reporte: ${porFecha}; diferencia: ${total - porFecha}`);
  check("Puerta 2: fecha real de creación", total === base.total, `${total} vs ${base.total}`);

  /* ── Estados ── */
  const estados = await raw<{ estado: string; total: number }>(`
    SELECT COALESCE(estado_homologado, 'otros') AS estado, COUNT(*)::int AS total
    FROM public.v_unificado_norm WHERE ${RANGO} AND ${FILTRO} GROUP BY 1
  `);
  const sumaEstados = estados.reduce((a, r) => a + r.total, 0);
  check("Puerta 3: estados suman el total", sumaEstados === total, `${sumaEstados} vs ${total}`);
  check("Puerta 3: siete grupos de estado", s.estados.length === 7, `${s.estados.length}`);
  check("Puerta 3: array de estados suma el total", s.estados.reduce((a, e) => a + e.total, 0) === total, `${s.estados.reduce((a, e) => a + e.total, 0)} vs ${total}`);
  const sumaPct = s.estados.reduce((a, e) => a + e.pct, 0);
  check("Puerta 3: porcentajes de estado suman 100", Math.abs(sumaPct - 100) < 0.5, `${sumaPct}%`);

  /* ── Canales y tipos ── */
  const canales = await raw<{ canal: string; total: number }>(`
    SELECT CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal, COUNT(*)::int AS total
    FROM public.v_unificado_norm WHERE ${RANGO} AND ${FILTRO} GROUP BY 1
  `);
  const sumaCanales = canales.reduce((a, r) => a + r.total, 0);
  check("Puerta 4: canales suman el total", sumaCanales === total, `${sumaCanales} vs ${total}`);
  check("Puerta 4: canales del contrato suman el total", s.canales.reduce((a, r) => a + r.total, 0) === total, `${s.canales.reduce((a, r) => a + r.total, 0)} vs ${total}`);
  check("Puerta 4: tipos suman el total", s.tipos.reduce((a, r) => a + r.total, 0) === total, `${s.tipos.reduce((a, r) => a + r.total, 0)} vs ${total}`);

  /* ── Tiempos ── */
  check("Puerta 5: primera respuesta n", s.kpis.primeraN === base.primera_n, `${s.kpis.primeraN} vs ${base.primera_n}`);
  check("Puerta 5: primera mediana", cerca(s.kpis.primeraMediana, base.primera_med), `${s.kpis.primeraMediana} vs ${base.primera_med}`);
  check("Puerta 5: primera p90", cerca(s.kpis.primeraP90, base.primera_p90), `${s.kpis.primeraP90} vs ${base.primera_p90}`);
  check("Puerta 5: primera promedio", cerca(s.kpis.primeraPromedio, base.primera_prom), `${s.kpis.primeraPromedio} vs ${base.primera_prom}`);
  check("Puerta 5: primera sin dato", s.kpis.primeraSinDato === total - base.primera_n, `${s.kpis.primeraSinDato} vs ${total - base.primera_n}`);
  check("Puerta 6: resolución n", s.kpis.resolucionN === base.resolucion_n, `${s.kpis.resolucionN} vs ${base.resolucion_n}`);
  check("Puerta 6: resolución mediana", cerca(s.kpis.resolucionMediana, base.resolucion_med), `${s.kpis.resolucionMediana} vs ${base.resolucion_med}`);
  check("Puerta 6: resolución p90", cerca(s.kpis.resolucionP90, base.resolucion_p90), `${s.kpis.resolucionP90} vs ${base.resolucion_p90}`);
  check("Puerta 6: resolución promedio", cerca(s.kpis.resolucionPromedio, base.resolucion_prom), `${s.kpis.resolucionPromedio} vs ${base.resolucion_prom}`);
  check("Puerta 6: resolución excluidas", s.kpis.resolucionExcluidas === base.resolucion_excluidas, `${s.kpis.resolucionExcluidas} vs ${base.resolucion_excluidas}`);
  check("Puerta 6: suma n por tipo = primera n", s.tiemposPorTipo.reduce((a, r) => a + r.primeraN, 0) === s.kpis.primeraN, `${s.tiemposPorTipo.reduce((a, r) => a + r.primeraN, 0)}`);
  check("Puerta 6: suma n por tipo = resolución n", s.tiemposPorTipo.reduce((a, r) => a + r.resolucionN, 0) === s.kpis.resolucionN, `${s.tiemposPorTipo.reduce((a, r) => a + r.resolucionN, 0)}`);
  check("Puerta 6: cobertura primera", cerca(s.kpis.primeraCobertura, Math.round((base.primera_n / total) * 1000) / 10), `${s.kpis.primeraCobertura}%`);
  check("Puerta 6: cobertura resolución", cerca(s.kpis.resolucionCobertura, Math.round((base.resolucion_n / total) * 1000) / 10), `${s.kpis.resolucionCobertura}%`);

  /* ── Evolución ── */
  const prev = (
    await raw<{ total: number }>(`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${CRE} >= '2026-09-01 00:00'::timestamp
        AND ${CRE} < ('2026-09-30 23:59'::timestamp + interval '1 minute')
        AND ${FILTRO}
    `)
  )[0].total;
  check("Puerta 7: evolución actual suma el total", s.evolucion.actual.reduce((a, r) => a + r.total, 0) === total, `${s.evolucion.actual.reduce((a, r) => a + r.total, 0)} vs ${total}`);
  check("Puerta 7: evolución anterior contra SQL", s.evolucion.totalAnterior === prev && s.evolucion.anterior.reduce((a, r) => a + r.total, 0) === prev, `${s.evolucion.totalAnterior}/${s.evolucion.anterior.reduce((a, r) => a + r.total, 0)} vs ${prev}`);
  check("Puerta 7: serie diaria completa", s.evolucion.actual.length === 31 && s.evolucion.anterior.length === 31, `${s.evolucion.actual.length}/${s.evolucion.anterior.length}`);
  check("Puerta 7: variación porcentual", cerca(s.evolucion.variacionPct, Math.round(((total - prev) / prev) * 1000) / 10), `${s.evolucion.variacionPct}%`);

  /* ── Asesores ── */
  const asesores = await raw<{ asesor: string; total: number }>(`
    SELECT COALESCE(INITCAP(TRANSLATE(SPLIT_PART(REPLACE(asesor, '_', ' '), ' ', 1), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')), 'Sin asesor') AS asesor,
           COUNT(*)::int AS total
    FROM public.v_unificado_norm WHERE ${RANGO} AND ${FILTRO}
    GROUP BY 1 ORDER BY total DESC
  `);
  check("Puerta 8: asesores suman el total", asesores.reduce((a, r) => a + r.total, 0) === total, `${asesores.reduce((a, r) => a + r.total, 0)} vs ${total}`);
  check("Puerta 8: array de asesores suma el total", s.asesores.reduce((a, r) => a + r.total, 0) === total, `${s.asesores.reduce((a, r) => a + r.total, 0)} vs ${total}`);

  /* ── Alex y métricas retiradas ── */
  const alex = (
    await raw<{ total: number }>(`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${RANGO} AND ${FILTRO} AND asesor ILIKE '%alex%'
    `)
  )[0].total;
  console.log(`Casos Q/D de Alex López en octubre: ${alex}`);
  check("Puerta 9: Alex sin casos Q/D", alex === 0, `${alex}`);

  const json = JSON.stringify(s);
  check("Puerta 10: sin FCR", !json.includes('"fcr"'), "sin campo fcr");
  check("Puerta 10: sin SLA", !json.includes('"sla'), "sin campos SLA");
  check("Puerta 10: sin totalGeneral", !json.includes('"totalGeneral"'), "sin totalGeneral");
  check("Puerta 10: sin país", !json.includes('"porPais"'), "sin porPais");
  check("Puerta 10: sin clientes", !json.includes('"porCliente"'), "sin porCliente");
  check("Puerta 10: sin hora", !json.includes('"porHora"'), "sin porHora");
  check("Puerta 10: sin día de semana", !json.includes('"porDiaSemana"'), "sin porDiaSemana");

  check("Puerta 11: sin NaN/Infinity", !numeroInvalido(s), "todos los números finitos");
  check("Puerta 12: coberturas <= 100", s.kpis.primeraCobertura <= 100 && s.kpis.resolucionCobertura <= 100, `${s.kpis.primeraCobertura}/${s.kpis.resolucionCobertura}`);

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Quejas y Devoluciones y SQL coinciden.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
