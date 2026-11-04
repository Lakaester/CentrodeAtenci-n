/**
 * Validación real (solo lectura) del reporte Operación.
 *
 * Uso:
 *   npx tsx scripts/validar-operacion.ts
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
}

const CREACION = Prisma.sql`CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;

const KEY = Prisma.sql`CASE
  WHEN UPPER(BTRIM(subcanal)) = 'ZENDESK'
    THEN 'ZENDESK:' || ticket_id::text
  ELSE 'WA:' || ticket_id::text
END`;

function base(where: Prisma.Sql = Prisma.empty): Prisma.Sql {
  return Prisma.sql`
    WITH n AS (
      SELECT v.*, ${CREACION} AS creacion, ${KEY} AS atencion_key
      FROM public.v_unificado_norm v
      ${where}
    ),
    d AS (
      SELECT DISTINCT ON (atencion_key) *
      FROM n
      ORDER BY atencion_key, creacion ASC, subcanal
    )
  `;
}

async function raw<T>(sql: Prisma.Sql): Promise<T[]> {
  return (await prisma.$queryRaw(sql)) as T[];
}

const sum = (rows: { total: number }[]) => rows.reduce((s, r) => s + r.total, 0);

async function main(): Promise<void> {
  console.log("\n=== Validación Reporte Operación ===");

  const t0 = Date.now();
  const data = await unificadoRepository.operacion({});
  const ms = Date.now() - t0;
  console.log(`Tiempo de respuesta del repositorio: ${ms} ms`);

  const directTotal = (
    await raw<{ total: number; dias: number }>(Prisma.sql`
      ${base()}
      SELECT COUNT(*)::int AS total,
             COUNT(DISTINCT creacion::date)::int AS dias
      FROM d
    `)
  )[0];

  check("KPI total = SQL deduplicado", data.kpis.total.valor === directTotal.total, `${data.kpis.total.valor} vs ${directTotal.total}`);
  check("KPI días con datos = SQL", data.kpis.diasConDatos === directTotal.dias, `${data.kpis.diasConDatos} vs ${directTotal.dias}`);
  check("Heatmap suma el total", sum(data.heatmap) === directTotal.total, `${sum(data.heatmap)} vs ${directTotal.total}`);
  check("Días por DOW suman días con datos", data.diasPorDia.reduce((s, r) => s + r.dias, 0) === directTotal.dias, `${data.diasPorDia.reduce((s, r) => s + r.dias, 0)} vs ${directTotal.dias}`);

  const rawCanal = await raw<{ etiqueta: string; total: number }>(Prisma.sql`
    WITH n AS (
      SELECT subcanal, ${CREACION} AS creacion
      FROM public.v_unificado_norm v
    )
    SELECT subcanal AS etiqueta, COUNT(*)::int AS total
    FROM n GROUP BY subcanal ORDER BY total DESC
  `);
  const rawTotal = sum(rawCanal);
  // La base es viva: se valida la invariante, no un total fijo de filas.
  check("Filas crudas > 0", rawTotal > 0, `${rawTotal}`);
  check("Duplicados entre canales = 2", data.duplicadosEntreCanales === 2, `${data.duplicadosEntreCanales}`);
  check("Total consolidado = crudo - duplicados", data.kpis.total.valor === rawTotal - data.duplicadosEntreCanales, `${data.kpis.total.valor} vs ${rawTotal - data.duplicadosEntreCanales}`);
  for (const c of rawCanal) {
    const fila = data.porSubcanal.find((x) => x.etiqueta === c.etiqueta);
    check(`Canal ${c.etiqueta}`, fila?.total === c.total, `${fila?.total} vs ${c.total}`);
  }

  const directHeat = await raw<{ dia: number; hora: number; total: number }>(Prisma.sql`
    ${base()}
    SELECT EXTRACT(DOW FROM creacion)::int AS dia,
           EXTRACT(HOUR FROM creacion)::int AS hora,
           COUNT(*)::int AS total
    FROM d GROUP BY 1,2
  `);
  const directPeakHMap = new Map<number, number>();
  for (const r of directHeat) directPeakHMap.set(r.hora, (directPeakHMap.get(r.hora) ?? 0) + r.total);
  const directPeakH = [...directPeakHMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const directPeakDMap = new Map<number, number>();
  for (const r of directHeat) directPeakDMap.set(r.dia, (directPeakDMap.get(r.dia) ?? 0) + r.total);
  const directPeakD = [...directPeakDMap.entries()].sort((a, b) => b[1] - a[1])[0];
  check("Hora pico", data.kpis.horaPico === `${String(directPeakH?.[0]).padStart(2, "0")}:00`, `${data.kpis.horaPico} vs ${directPeakH?.[0]}`);
  check("Hora pico valor", data.kpis.horaPicoValor === directPeakH?.[1], `${data.kpis.horaPicoValor} vs ${directPeakH?.[1]}`);
  check("Día pico", data.kpis.diaCargadoValor === directPeakD?.[1], `${data.kpis.diaCargadoValor} vs ${directPeakD?.[1]}`);

  for (const g of ["diaria", "semanal", "mensual", "trimestral"] as const) {
    const serie = data.evolucion[g];
    check(`Evolución ${g}: suma = total`, sum(serie.actual) === data.kpis.total.valor, `${sum(serie.actual)} vs ${data.kpis.total.valor}`);
    const canalSum = serie.actual.reduce(
      (s, p) => s + p.porSubcanal.reduce((x, c) => x + c.total, 0),
      0,
    );
    check(
      `Evolución ${g}: canales = crudo`,
      canalSum === rawTotal,
      `${canalSum} vs ${rawTotal}`,
    );
  }

  const detalle = await unificadoRepository.operacion({ subcanal: ["WHATMETA"] });
  const filasWameta = rawCanal.find((c) => c.etiqueta === "WHATMETA")?.total ?? 0;
  check(
    "Filtro WAMETA conserva sus filas",
    detalle.kpis.total.valor === filasWameta,
    `${detalle.kpis.total.valor} vs ${filasWameta}`,
  );
  check(
    "Filtro WAMETA sin duplicados",
    detalle.duplicadosEntreCanales === 0,
    `${detalle.duplicadosEntreCanales}`,
  );
  check(
    "Filtro WAMETA una sola distribución",
    detalle.porSubcanal.find((c) => c.etiqueta === "WHATMETA")?.total === detalle.kpis.total.valor,
    `${detalle.porSubcanal.map((c) => `${c.etiqueta}:${c.total}`).join(", ")}`,
  );

  const rango = { fechaHoraInicio: "2026-08-01 00:00", fechaHoraFin: "2026-10-31 23:59" };
  const dataRango = await unificadoRepository.operacion(rango);
  const directRango = (
    await raw<{ total: number }>(Prisma.sql`
      ${base(Prisma.sql`WHERE ${CREACION} >= ${"2026-08-01"}::date AND ${CREACION} < (${"2026-10-31"}::date + interval '1 day')`)}
      SELECT COUNT(*)::int AS total FROM d
    `)
  )[0];
  check("Rango: total", dataRango.kpis.total.valor === directRango.total, `${dataRango.kpis.total.valor} vs ${directRango.total}`);
  check("Rango: comparado con", dataRango.rango?.comparadoCon != null, `${dataRango.rango?.comparadoCon?.inicio} → ${dataRango.rango?.comparadoCon?.fin}`);

  const invalidos = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM public.v_unificado_norm
      WHERE fecha IS NULL OR hora IS NULL OR BTRIM(hora) = ''
         OR hora !~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$'
    `)
  )[0];
  check("Registros con fecha/hora inválida", invalidos.total === 0, `${invalidos.total}`);

  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Operación y SQL coinciden.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
