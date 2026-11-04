/**
 * Validación real (solo lectura) del reporte WhatsApp.
 *
 * Uso:
 *   npx tsx scripts/validar-whatsapp.ts
 *
 * Cubre las 13 puertas del plan:
 * 1. Total = Wameta + Whaticket.
 * 2. Total = cerradas + abiertas + sin estado + otros.
 * 3. KPI consolidados contra SQL.
 * 4. Primera respuesta: n, cobertura, mediana y p90; faltantes excluidos.
 * 5. Resolución: n, cobertura, mediana y p90; faltantes excluidos.
 * 6. SLA de primera respuesta ≤15 min, con cumple/evaluables.
 * 7. FCR ausente.
 * 8. Evolución actual vs. periodo anterior equivalente.
 * 9. Horas y días suman el total.
 * 10. Filtros globales.
 * 11. Sin NaN/Infinity.
 * 12. Pruebas/TypeScript/builds se ejecutan aparte.
 * 13. Revisión visual se realiza aparte.
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
const W = Prisma.sql`(subcanal IN ('whaticket', 'whatmeta') OR canal ILIKE '%what%')`;
const RANGE = Prisma.sql`(fecha::date + hora::time) >= ${FILTER.fechaHoraInicio}::timestamp
  AND (fecha::date + hora::time) < (${FILTER.fechaHoraFin}::timestamp + interval '1 minute')`;
const P_VAL = Prisma.sql`NOT (primera_respuesta IS NULL AND primera_respuesta_min = 0)`;
const R_VAL = Prisma.sql`NOT (resolucion IS NULL AND resolucion_min = 0)`;
const WHERE = Prisma.sql`WHERE ${W} AND ${RANGE}`;
const UMBRAL = 15;

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
  console.log("\n=== Validación Reporte WhatsApp ===");
  const t0 = Date.now();
  const s = await unificadoRepository.whatsapp(FILTER);
  console.log(`Tiempo del repositorio: ${Date.now() - t0} ms`);

  /* ── KPI consolidado vs SQL ── */
  const kpi = (
    await raw<{
      total: number;
      whaticket: number;
      wameta: number;
      primera_n: number;
      sla_cumple: number;
      primera_med: number | null;
      primera_p90: number | null;
      resolucion_n: number;
      resolucion_med: number | null;
      resolucion_p90: number | null;
      cerradas: number;
      abiertas: number;
      sin_estado: number;
      otros: number;
    }>(Prisma.sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE subcanal ILIKE '%ticket%')::int AS whaticket,
             COUNT(*) FILTER (WHERE subcanal ILIKE '%meta%')::int AS wameta,
             COUNT(*) FILTER (WHERE ${P_VAL})::int AS primera_n,
             COUNT(*) FILTER (
               WHERE ${P_VAL} AND primera_respuesta_min_norm <= ${UMBRAL}
             )::int AS sla_cumple,
             (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
               FILTER (WHERE ${P_VAL}))::float8 AS primera_med,
             (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
               FILTER (WHERE ${P_VAL}))::float8 AS primera_p90,
             COUNT(*) FILTER (WHERE ${R_VAL})::int AS resolucion_n,
             (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm)
               FILTER (WHERE ${R_VAL}))::float8 AS resolucion_med,
             (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm)
               FILTER (WHERE ${R_VAL}))::float8 AS resolucion_p90,
             COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS cerradas,
             COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
             COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_estado,
             COUNT(*) FILTER (
               WHERE estado_homologado NOT IN ('cerrado', 'resuelto', 'abierto', 'sin_mapear')
             )::int AS otros
      FROM public.v_unificado_norm ${WHERE}
    `)
  )[0];

  check("Puerta 1: total = Wameta + Whaticket", s.kpis.totalConversaciones === s.kpis.totalWameta + s.kpis.totalWhaticket, `${s.kpis.totalConversaciones} vs ${s.kpis.totalWameta} + ${s.kpis.totalWhaticket}`);
  check("Puerta 1: total contra SQL", s.kpis.totalConversaciones === kpi.total, `${s.kpis.totalConversaciones} vs ${kpi.total}`);
  check("Puerta 1: Wameta contra SQL", s.kpis.totalWameta === kpi.wameta, `${s.kpis.totalWameta} vs ${kpi.wameta}`);
  check("Puerta 1: Whaticket contra SQL", s.kpis.totalWhaticket === kpi.whaticket, `${s.kpis.totalWhaticket} vs ${kpi.whaticket}`);

  const sumaEstados = s.kpis.cerradas + s.kpis.abiertas + s.kpis.sinEstado + s.kpis.otros;
  check("Puerta 2: estados suman el total", sumaEstados === s.kpis.totalConversaciones, `${sumaEstados} vs ${s.kpis.totalConversaciones}`);
  check(
    "Puerta 2: cerradas + abiertas + sin estado contra SQL",
    s.kpis.cerradas === kpi.cerradas && s.kpis.abiertas === kpi.abiertas && s.kpis.sinEstado === kpi.sin_estado && s.kpis.otros === kpi.otros,
    `${s.kpis.cerradas}/${s.kpis.abiertas}/${s.kpis.sinEstado}/${s.kpis.otros} vs ${kpi.cerradas}/${kpi.abiertas}/${kpi.sin_estado}/${kpi.otros}`,
  );
  const sumaEstadosArray = s.estados.reduce((a, e) => a + e.total, 0);
  check("Puerta 2: array de estados suma el total", sumaEstadosArray === s.kpis.totalConversaciones, `${sumaEstadosArray} vs ${s.kpis.totalConversaciones}`);

  check("Puerta 3: primera respuesta n", s.kpis.primeraN === kpi.primera_n, `${s.kpis.primeraN} vs ${kpi.primera_n}`);
  check("Puerta 3: primera respuesta mediana", cerca(s.kpis.primeraMediana, kpi.primera_med), `${s.kpis.primeraMediana} vs ${kpi.primera_med}`);
  check("Puerta 3: primera respuesta p90", cerca(s.kpis.primeraP90, kpi.primera_p90), `${s.kpis.primeraP90} vs ${kpi.primera_p90}`);
  check(
    "Puerta 3: cobertura primera respuesta",
    cerca(s.kpis.primeraCobertura, Math.round((kpi.primera_n / kpi.total) * 1000) / 10),
    `${s.kpis.primeraCobertura}%`,
  );

  check("Puerta 4: resolución n", s.kpis.resolucionN === kpi.resolucion_n, `${s.kpis.resolucionN} vs ${kpi.resolucion_n}`);
  check("Puerta 4: resolución mediana", cerca(s.kpis.resolucionMediana, kpi.resolucion_med), `${s.kpis.resolucionMediana} vs ${kpi.resolucion_med}`);
  check("Puerta 4: resolución p90", cerca(s.kpis.resolucionP90, kpi.resolucion_p90), `${s.kpis.resolucionP90} vs ${kpi.resolucion_p90}`);
  check(
    "Puerta 4: cobertura resolución",
    cerca(s.kpis.resolucionCobertura, Math.round((kpi.resolucion_n / kpi.total) * 1000) / 10),
    `${s.kpis.resolucionCobertura}%`,
  );

  check("Puerta 5: SLA cumple", s.kpis.slaPrimeraCumple === kpi.sla_cumple, `${s.kpis.slaPrimeraCumple} vs ${kpi.sla_cumple}`);
  check("Puerta 5: SLA evaluables", s.kpis.slaPrimeraEvaluables === kpi.primera_n, `${s.kpis.slaPrimeraEvaluables} vs ${kpi.primera_n}`);
  check("Puerta 5: SLA porcentaje", cerca(s.kpis.slaPrimeraPct, Math.round((kpi.sla_cumple / kpi.primera_n) * 1000) / 10), `${s.kpis.slaPrimeraPct}%`);
  check("Puerta 5: umbral 15 min", s.kpis.slaPrimeraUmbral === 15, `${s.kpis.slaPrimeraUmbral}`);

  const json = JSON.stringify(s);
  check("Puerta 6: FCR ausente", !json.includes('"fcr"'), "sin campo fcr");
  check("Puerta 6: espera ausente", !json.includes('"tiempoEspera"'), "sin campo tiempoEspera");
  check("Puerta 6: sin regla de 20 min", !json.includes('"sla20"') && s.kpis.slaPrimeraUmbral === 15, "solo 15 min");
  check("Puerta 6: sin meta de resolución 120", !json.includes('"slaResolucion"'), "sin SLA de resolución");

  /* ── Plataformas ── */
  const plataformas = await raw<{
    subcanal: string;
    total: number;
    primera_n: number;
    cumple: number;
    primera_med: number | null;
    primera_p90: number | null;
    resolucion_n: number;
    resolucion_med: number | null;
    resolucion_p90: number | null;
    cerradas: number;
    abiertas: number;
    sin_estado: number;
  }>(Prisma.sql`
    SELECT REPLACE(subcanal, '_', ' ') AS subcanal,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE ${P_VAL})::int AS primera_n,
           COUNT(*) FILTER (WHERE ${P_VAL} AND primera_respuesta_min_norm <= ${UMBRAL})::int AS cumple,
           (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
             FILTER (WHERE ${P_VAL}))::float8 AS primera_med,
           (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
             FILTER (WHERE ${P_VAL}))::float8 AS primera_p90,
           COUNT(*) FILTER (WHERE ${R_VAL})::int AS resolucion_n,
           (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm)
             FILTER (WHERE ${R_VAL}))::float8 AS resolucion_med,
           (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm)
             FILTER (WHERE ${R_VAL}))::float8 AS resolucion_p90,
           COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS cerradas,
           COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
           COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_estado
    FROM public.v_unificado_norm ${WHERE}
    GROUP BY 1 ORDER BY 1
  `);

  check(
    "Puerta 3: plataformas suman el total",
    s.plataformas.reduce((a, p) => a + p.total, 0) === s.kpis.totalConversaciones,
    `${s.plataformas.reduce((a, p) => a + p.total, 0)} vs ${s.kpis.totalConversaciones}`,
  );
  const wameta = s.plataformas.find((p) => p.nombre === "Wameta");
  const whaticket = s.plataformas.find((p) => p.nombre === "Whaticket");
  check("Puerta 3: nombres Wameta/Whaticket", !!wameta && !!whaticket, s.plataformas.map((p) => p.nombre).join(", "));
  check("Puerta 3: no se usa Whatmeta", !s.plataformas.some((p) => p.nombre === "Whatmeta"), "sin Whatmeta");

  for (const p of s.plataformas) {
    const sql = plataformas.find((r) => r.subcanal === p.subcanal);
    if (!sql) {
      check(`Plataforma ${p.nombre}`, false, "sin fila SQL");
      continue;
    }
    const cobertura = Math.round((sql.primera_n / sql.total) * 1000) / 10;
    const coberturaRes = Math.round((sql.resolucion_n / sql.total) * 1000) / 10;
    check(
      `Plataforma ${p.nombre}: volumen`,
      p.total === sql.total,
      `${p.total} vs ${sql.total}`,
    );
    check(
      `Plataforma ${p.nombre}: cobertura primera respuesta`,
      cerca(p.primeraCobertura, cobertura),
      `${p.primeraCobertura}% vs ${cobertura}%`,
    );
    check(
      `Plataforma ${p.nombre}: mediana/p90 primera`,
      cerca(p.primeraMediana, sql.primera_med) && cerca(p.primeraP90, sql.primera_p90),
      `${p.primeraMediana}/${p.primeraP90} vs ${sql.primera_med}/${sql.primera_p90}`,
    );
    check(
      `Plataforma ${p.nombre}: cobertura resolución`,
      cerca(p.resolucionCobertura, coberturaRes),
      `${p.resolucionCobertura}% vs ${coberturaRes}%`,
    );
    check(
      `Plataforma ${p.nombre}: mediana/p90 resolución`,
      cerca(p.resolucionMediana, sql.resolucion_med) && cerca(p.resolucionP90, sql.resolucion_p90),
      `${p.resolucionMediana}/${p.resolucionP90} vs ${sql.resolucion_med}/${sql.resolucion_p90}`,
    );
    check(
      `Plataforma ${p.nombre}: SLA`,
      p.slaCumple === sql.cumple && p.slaEvaluables === sql.primera_n,
      `${p.slaCumple}/${p.slaEvaluables} vs ${sql.cumple}/${sql.primera_n}`,
    );
    check(
      `Plataforma ${p.nombre}: estados`,
      p.cerradas === sql.cerradas && p.abiertas === sql.abiertas && p.sinEstado === sql.sin_estado,
      `${p.cerradas}/${p.abiertas}/${p.sinEstado} vs ${sql.cerradas}/${sql.abiertas}/${sql.sin_estado}`,
    );
  }

  /* ── Evolución ── */
  const prev = rangoAnterior(FILTER.fechaHoraInicio, FILTER.fechaHoraFin);
  const prevTotal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${W}
        AND (fecha::date + hora::time) >= ${`${prev.inicio} 00:00`}::timestamp
        AND (fecha::date + hora::time) < (${`${prev.fin} 23:59`}::timestamp + interval '1 minute')
    `)
  )[0];
  const sumaActual = s.evolucion.actual.reduce((a, r) => a + r.total, 0);
  const sumaAnterior = s.evolucion.anterior.reduce((a, r) => a + r.total, 0);
  check("Puerta 7: evolución actual suma el total", sumaActual === s.kpis.totalConversaciones, `${sumaActual} vs ${s.kpis.totalConversaciones}`);
  check("Puerta 7: evolución anterior contra SQL", s.evolucion.totalAnterior === prevTotal.total && sumaAnterior === prevTotal.total, `${s.evolucion.totalAnterior}/${sumaAnterior} vs ${prevTotal.total}`);
  check("Puerta 7: serie diaria completa", s.evolucion.actual.length === 31 && s.evolucion.anterior.length === 31, `${s.evolucion.actual.length}/${s.evolucion.anterior.length}`);
  check(
    "Puerta 7: variación porcentual",
    cerca(s.evolucion.variacionPct, Math.round(((s.kpis.totalConversaciones - prevTotal.total) / prevTotal.total) * 1000) / 10),
    `${s.evolucion.variacionPct}%`,
  );

  /* ── Horas y días ── */
  check("Puerta 8: 24 horas", s.horas.length === 24, `${s.horas.length}`);
  check("Puerta 8: horas suman el total", s.horas.reduce((a, r) => a + r.total, 0) === s.kpis.totalConversaciones, `${s.horas.reduce((a, r) => a + r.total, 0)}`);
  check("Puerta 8: 7 días", s.dias.length === 7, `${s.dias.length}`);
  check("Puerta 8: días suman el total", s.dias.reduce((a, r) => a + r.total, 0) === s.kpis.totalConversaciones, `${s.dias.reduce((a, r) => a + r.total, 0)}`);

  /* ── Excepciones ── */
  check(
    "Puerta 9: abiertas >24 h",
    s.excepciones.filter((e) => e.estado === "Abierta").every((e) => e.tiempo > 1440 && e.tipoTiempo === "transcurrido" && e.umbral === 1440),
    `${s.excepciones.filter((e) => e.estado === "Abierta").length}`,
  );
  check(
    "Puerta 9: cerradas/sin estado >8 h",
    s.excepciones.filter((e) => e.estado !== "Abierta").every((e) => e.tiempo > 480 && e.tipoTiempo === "resolucion" && e.umbral === 480),
    `${s.excepciones.filter((e) => e.estado !== "Abierta").length}`,
  );
  check("Puerta 9: excepciones con estado", s.excepciones.every((e) => ["Abierta", "Cerrada", "Sin estado"].includes(e.estado)), `${s.excepciones.length}`);

  /* ── Filtros globales ── */
  const sWameta = await unificadoRepository.whatsapp({ ...FILTER, subcanal: ["WHATMETA"] });
  check("Puerta 10: filtro Wameta total", sWameta.kpis.totalConversaciones === s.kpis.totalWameta, `${sWameta.kpis.totalConversaciones} vs ${s.kpis.totalWameta}`);
  check("Puerta 10: filtro Wameta sin Whaticket", sWameta.kpis.totalWhaticket === 0, `${sWameta.kpis.totalWhaticket}`);
  check(
    "Puerta 10: filtro Wameta estados suman",
    sWameta.kpis.cerradas + sWameta.kpis.abiertas + sWameta.kpis.sinEstado + sWameta.kpis.otros === sWameta.kpis.totalConversaciones,
    "estados reconciliados",
  );

  const sep = await unificadoRepository.whatsapp({
    fechaHoraInicio: "2026-09-01 00:00",
    fechaHoraFin: "2026-09-30 23:59",
  });
  const sepTotal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${W}
        AND (fecha::date + hora::time) >= '2026-09-01 00:00'::timestamp
        AND (fecha::date + hora::time) < ('2026-09-30 23:59'::timestamp + interval '1 minute')
    `)
  )[0];
  check("Puerta 10: rango septiembre", sep.kpis.totalConversaciones === sepTotal.total, `${sep.kpis.totalConversaciones} vs ${sepTotal.total}`);

  /* ── Sin NaN / Infinity ── */
  check("Puerta 11: sin NaN/Infinity", !tieneNumeroInvalido(s), "todos los números finitos");
  check(
    "Puerta 11: cobertura no supera 100",
    s.kpis.primeraCobertura <= 100 && s.kpis.resolucionCobertura <= 100,
    `${s.kpis.primeraCobertura}/${s.kpis.resolucionCobertura}`,
  );

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: WhatsApp y SQL coinciden.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
