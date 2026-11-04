/**
 * Validación real (solo lectura) del reporte Zendesk.
 *
 * Uso:
 *   npx tsx scripts/validar-zendesk.ts
 *
 * Cubre las 15 puertas del plan:
 * 1. Total = suma de estados.
 * 2. Estados mutuamente excluyentes.
 * 3. Demanda por fecha real de creación.
 * 4. Primera respuesta vs SQL.
 * 5. Resolución vs SQL.
 * 6. Mediana, p90 y promedio coherentes con sus evaluables.
 * 7. Cobertura sobre el universo correcto.
 * 8. FCR ausente.
 * 9. SLA solo primera respuesta 1,440 min.
 * 10. Evolución actual/anterior equivalente.
 * 11. Backlog con fecha de corte y estados válidos.
 * 12. Filtros globales.
 * 13. Sin NaN/Infinity.
 * 14. Pruebas/TypeScript/builds se ejecutan aparte.
 * 15. Revisión visual se realiza aparte.
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";
import { rangoAnterior } from "../src/utils/filtros";

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

const FILTER = {
  fechaHoraInicio: "2026-10-01 00:00",
  fechaHoraFin: "2026-10-31 23:59",
};
const Z = Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`;
const CRE = Prisma.sql`CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;
const RANGE = Prisma.sql`${CRE} >= ${FILTER.fechaHoraInicio}::timestamp
  AND ${CRE} < (${FILTER.fechaHoraFin}::timestamp + interval '1 minute')`;
const WHERE = Prisma.sql`WHERE ${Z} AND ${RANGE}`;
const P_VAL = Prisma.sql`primera_respuesta_min_norm IS NOT NULL`;
const R_VAL = Prisma.sql`(
  resolucion_min_norm IS NOT NULL
  AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
)`;
const UMBRAL = 1440;

async function raw<T>(sql: Prisma.Sql): Promise<T[]> {
  return (await prisma.$queryRaw(sql)) as T[];
}

const cerca = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && Math.abs(a - b) < 0.11;

function tieneNumeroInvalido(value: unknown): boolean {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(tieneNumeroInvalido);
  if (value && typeof value === "object") {
    return Object.values(value).some(tieneNumeroInvalido);
  }
  return false;
}

async function main(): Promise<void> {
  console.log("\n=== Validación Reporte Zendesk ===");
  const t0 = Date.now();
  const s = await unificadoRepository.zendesk(FILTER);
  console.log(`Tiempo del repositorio: ${Date.now() - t0} ms`);

  /* ── KPI vs SQL ── */
  const kpi = (
    await raw<{
      total: number;
      cerrados: number;
      resueltos: number;
      abiertos: number;
      pendientes: number;
      en_espera: number;
      otros: number;
      primera_n: number;
      sla_cumple: number;
      primera_med: number | null;
      primera_p90: number | null;
      primera_prom: number | null;
      resolucion_n: number;
      resolucion_excluidas: number;
      resolucion_med: number | null;
      resolucion_p90: number | null;
      resolucion_prom: number | null;
    }>(Prisma.sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE estado_homologado = 'cerrado')::int AS cerrados,
             COUNT(*) FILTER (WHERE estado_homologado = 'resuelto')::int AS resueltos,
             COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
             COUNT(*) FILTER (WHERE estado_homologado = 'pendiente')::int AS pendientes,
             COUNT(*) FILTER (WHERE estado_homologado = 'en_espera')::int AS en_espera,
             COUNT(*) FILTER (
               WHERE estado_homologado NOT IN ('cerrado','resuelto','abierto','pendiente','en_espera')
             )::int AS otros,
             COUNT(*) FILTER (WHERE ${P_VAL})::int AS primera_n,
             COUNT(*) FILTER (WHERE ${P_VAL} AND primera_respuesta_min_norm <= ${UMBRAL})::int AS sla_cumple,
             (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm) FILTER (WHERE ${P_VAL}))::float8 AS primera_med,
             (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm) FILTER (WHERE ${P_VAL}))::float8 AS primera_p90,
             ROUND((AVG(primera_respuesta_min_norm) FILTER (WHERE ${P_VAL}))::numeric, 1)::float8 AS primera_prom,
             COUNT(*) FILTER (WHERE ${R_VAL})::int AS resolucion_n,
             COUNT(*) FILTER (
               WHERE resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL
             )::int AS resolucion_excluidas,
             (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (WHERE ${R_VAL}))::float8 AS resolucion_med,
             (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (WHERE ${R_VAL}))::float8 AS resolucion_p90,
             ROUND((AVG(resolucion_min_norm) FILTER (WHERE ${R_VAL}))::numeric, 1)::float8 AS resolucion_prom
      FROM public.v_unificado_norm ${WHERE}
    `)
  )[0];

  const sumaEstados =
    kpi.cerrados + kpi.resueltos + kpi.abiertos + kpi.pendientes + kpi.en_espera + kpi.otros;
  check("Puerta 1: total contra SQL", s.kpis.totalTickets === kpi.total, `${s.kpis.totalTickets} vs ${kpi.total}`);
  check("Puerta 1: estados suman el total", sumaEstados === kpi.total, `${sumaEstados} vs ${kpi.total}`);
  check("Puerta 2: cerrados", s.kpis.cerrados === kpi.cerrados, `${s.kpis.cerrados} vs ${kpi.cerrados}`);
  check("Puerta 2: resueltos", s.kpis.resueltos === kpi.resueltos, `${s.kpis.resueltos} vs ${kpi.resueltos}`);
  check("Puerta 2: abiertos", s.kpis.abiertos === kpi.abiertos, `${s.kpis.abiertos} vs ${kpi.abiertos}`);
  check("Puerta 2: pendientes", s.kpis.pendientes === kpi.pendientes, `${s.kpis.pendientes} vs ${kpi.pendientes}`);
  check("Puerta 2: en espera", s.kpis.enEspera === kpi.en_espera, `${s.kpis.enEspera} vs ${kpi.en_espera}`);
  check("Puerta 2: otros", s.kpis.otros === kpi.otros, `${s.kpis.otros} vs ${kpi.otros}`);
  check("Puerta 2: seis grupos", s.estados.length === 6, `${s.estados.length}`);
  check(
    "Puerta 2: array de estados suma el total",
    s.estados.reduce((a, e) => a + e.total, 0) === s.kpis.totalTickets,
    `${s.estados.reduce((a, e) => a + e.total, 0)} vs ${s.kpis.totalTickets}`,
  );
  const sumaPct = s.estados.reduce((a, e) => a + e.pct, 0);
  check("Puerta 2: porcentajes suman 100", Math.abs(sumaPct - 100) < 0.5, `${sumaPct}%`);

  /* ── Universo: fecha real de creación ── */
  const fechaTotal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${Z} AND fecha >= '2026-10-01'::date AND fecha < '2026-11-01'::date
    `)
  )[0].total;
  console.log(`Universo por creación: ${s.kpis.totalTickets}; por fecha de reporte: ${fechaTotal}; diferencia: ${s.kpis.totalTickets - fechaTotal}`);
  check("Puerta 3: demanda por creación == SQL", s.kpis.totalTickets === kpi.total, `${s.kpis.totalTickets} vs ${kpi.total}`);

  /* ── Primera respuesta ── */
  check("Puerta 4: primera respuesta n", s.kpis.primeraN === kpi.primera_n, `${s.kpis.primeraN} vs ${kpi.primera_n}`);
  check("Puerta 4: primera respuesta mediana", cerca(s.kpis.primeraMediana, kpi.primera_med), `${s.kpis.primeraMediana} vs ${kpi.primera_med}`);
  check("Puerta 4: primera respuesta p90", cerca(s.kpis.primeraP90, kpi.primera_p90), `${s.kpis.primeraP90} vs ${kpi.primera_p90}`);
  check("Puerta 4: primera respuesta promedio", cerca(s.kpis.primeraPromedio, kpi.primera_prom), `${s.kpis.primeraPromedio} vs ${kpi.primera_prom}`);
  check("Puerta 4: primera respuesta sin dato", s.kpis.primeraSinDato === kpi.total - kpi.primera_n, `${s.kpis.primeraSinDato} vs ${kpi.total - kpi.primera_n}`);

  /* ── Resolución ── */
  check("Puerta 5: resolución n", s.kpis.resolucionN === kpi.resolucion_n, `${s.kpis.resolucionN} vs ${kpi.resolucion_n}`);
  check("Puerta 5: resolución mediana", cerca(s.kpis.resolucionMediana, kpi.resolucion_med), `${s.kpis.resolucionMediana} vs ${kpi.resolucion_med}`);
  check("Puerta 5: resolución p90", cerca(s.kpis.resolucionP90, kpi.resolucion_p90), `${s.kpis.resolucionP90} vs ${kpi.resolucion_p90}`);
  check("Puerta 5: resolución promedio", cerca(s.kpis.resolucionPromedio, kpi.resolucion_prom), `${s.kpis.resolucionPromedio} vs ${kpi.resolucion_prom}`);
  check("Puerta 5: resolución excluidas", s.kpis.resolucionExcluidas === kpi.resolucion_excluidas, `${s.kpis.resolucionExcluidas} vs ${kpi.resolucion_excluidas}`);

  /* ── Cobertura ── */
  check(
    "Puerta 6: cobertura primera respuesta",
    cerca(s.kpis.primeraCobertura, Math.round((kpi.primera_n / kpi.total) * 1000) / 10),
    `${s.kpis.primeraCobertura}%`,
  );
  check(
    "Puerta 6: cobertura resolución",
    cerca(s.kpis.resolucionCobertura, Math.round((kpi.resolucion_n / kpi.total) * 1000) / 10),
    `${s.kpis.resolucionCobertura}%`,
  );
  check("Puerta 6: primera n <= total", kpi.primera_n <= kpi.total, `${kpi.primera_n}/${kpi.total}`);
  check("Puerta 6: resolución n <= total", kpi.resolucion_n <= kpi.total, `${kpi.resolucion_n}/${kpi.total}`);

  /* ── SLA ── */
  check("Puerta 7: SLA cumple", s.kpis.slaPrimeraCumple === kpi.sla_cumple, `${s.kpis.slaPrimeraCumple} vs ${kpi.sla_cumple}`);
  check("Puerta 7: SLA evaluables", s.kpis.slaPrimeraEvaluables === kpi.primera_n, `${s.kpis.slaPrimeraEvaluables} vs ${kpi.primera_n}`);
  check("Puerta 7: SLA porcentaje", cerca(s.kpis.slaPrimeraPct, Math.round((kpi.sla_cumple / kpi.primera_n) * 1000) / 10), `${s.kpis.slaPrimeraPct}%`);
  check("Puerta 7: umbral 1,440 min", s.kpis.slaPrimeraUmbral === 1440, `${s.kpis.slaPrimeraUmbral}`);

  const json = JSON.stringify(s);
  check("Puerta 8: FCR ausente", !json.includes('"fcr"'), "sin campo fcr");
  check("Puerta 8: tiempo promedio por ticket ausente", !json.includes('"tiempoPromedioTicket"'), "sin campo duplicado");
  check("Puerta 9: SLA resolución ausente", !json.includes('"slaResolucion"'), "sin SLA de resolución");
  check("Puerta 9: sin regla de 20 min", !json.includes('"sla20"') && s.kpis.slaPrimeraUmbral === 1440, "solo 1,440 min");

  /* ── Evolución ── */
  const prev = rangoAnterior(FILTER.fechaHoraInicio, FILTER.fechaHoraFin);
  const prevTotal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${Z}
        AND ${CRE} >= ${`${prev.inicio} 00:00`}::timestamp
        AND ${CRE} < (${`${prev.fin} 23:59`}::timestamp + interval '1 minute')
    `)
  )[0].total;
  const sumaActual = s.evolucion.actual.reduce((a, r) => a + r.total, 0);
  const sumaAnterior = s.evolucion.anterior.reduce((a, r) => a + r.total, 0);
  check("Puerta 10: evolución actual suma el total", sumaActual === s.kpis.totalTickets, `${sumaActual} vs ${s.kpis.totalTickets}`);
  check("Puerta 10: evolución anterior contra SQL", s.evolucion.totalAnterior === prevTotal && sumaAnterior === prevTotal, `${s.evolucion.totalAnterior}/${sumaAnterior} vs ${prevTotal}`);
  check("Puerta 10: serie diaria completa", s.evolucion.actual.length === 31 && s.evolucion.anterior.length === 31, `${s.evolucion.actual.length}/${s.evolucion.anterior.length}`);
  check(
    "Puerta 10: variación porcentual",
    cerca(s.evolucion.variacionPct, Math.round(((s.kpis.totalTickets - prevTotal) / prevTotal) * 1000) / 10),
    `${s.evolucion.variacionPct}%`,
  );

  /* ── Backlog y corte ── */
  const backlog = (
    await raw<{ abiertos: number; pendientes: number; en_espera: number }>(Prisma.sql`
      SELECT COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
             COUNT(*) FILTER (WHERE estado_homologado = 'pendiente')::int AS pendientes,
             COUNT(*) FILTER (WHERE estado_homologado = 'en_espera')::int AS en_espera
      FROM public.v_unificado_norm WHERE ${Z}
    `)
  )[0];
  const corte = (
    await raw<{ fecha_corte: string }>(Prisma.sql`
      SELECT TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'YYYY-MM-DD HH24:MI') AS fecha_corte
    `)
  )[0].fecha_corte;
  check("Puerta 11: backlog abiertos", s.backlog.abiertos === backlog.abiertos, `${s.backlog.abiertos} vs ${backlog.abiertos}`);
  check("Puerta 11: backlog pendientes", s.backlog.pendientes === backlog.pendientes, `${s.backlog.pendientes} vs ${backlog.pendientes}`);
  check("Puerta 11: backlog en espera", s.backlog.enEspera === backlog.en_espera, `${s.backlog.enEspera} vs ${backlog.en_espera}`);
  check(
    "Puerta 11: backlog total",
    s.backlog.total === backlog.abiertos + backlog.pendientes + backlog.en_espera,
    `${s.backlog.total}`,
  );
  check(
    "Puerta 11: fecha de corte válida y no futura",
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s.backlog.fechaCorte) && s.backlog.fechaCorte <= corte,
    `${s.backlog.fechaCorte} vs ${corte}`,
  );

  /* ── Filtros globales ── */
  const sZendesk = await unificadoRepository.zendesk({ ...FILTER, subcanal: ["ZENDESK"] });
  check("Puerta 12: filtro subcanal ZENDESK", sZendesk.kpis.totalTickets === s.kpis.totalTickets, `${sZendesk.kpis.totalTickets} vs ${s.kpis.totalTickets}`);
  check(
    "Puerta 12: filtro ZENDESK estados suman",
    sZendesk.kpis.cerrados + sZendesk.kpis.resueltos + sZendesk.kpis.abiertos + sZendesk.kpis.pendientes + sZendesk.kpis.enEspera + sZendesk.kpis.otros === sZendesk.kpis.totalTickets,
    "estados reconciliados",
  );

  const sep = await unificadoRepository.zendesk({
    fechaHoraInicio: "2026-09-01 00:00",
    fechaHoraFin: "2026-09-30 23:59",
  });
  const sepTotal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${Z}
        AND ${CRE} >= '2026-09-01 00:00'::timestamp
        AND ${CRE} < ('2026-09-30 23:59'::timestamp + interval '1 minute')
    `)
  )[0].total;
  check("Puerta 12: rango septiembre", sep.kpis.totalTickets === sepTotal, `${sep.kpis.totalTickets} vs ${sepTotal}`);

  /* ── Sin NaN / Infinity ── */
  check("Puerta 13: sin NaN/Infinity", !tieneNumeroInvalido(s), "todos los números finitos");
  check(
    "Puerta 13: coberturas <= 100",
    s.kpis.primeraCobertura <= 100 && s.kpis.resolucionCobertura <= 100,
    `${s.kpis.primeraCobertura}/${s.kpis.resolucionCobertura}`,
  );

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Zendesk y SQL coinciden.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
