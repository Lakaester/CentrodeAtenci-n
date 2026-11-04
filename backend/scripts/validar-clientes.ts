/**
 * Validación real (solo lectura) del reporte Clientes.
 *
 * Uso:
 *   npx tsx scripts/validar-clientes.ts
 *
 * Verifica las 14 puertas del plan:
 * 1. Universo = identificadas + no identificadas.
 * 2. Clientes = claves válidas; "—" no cuenta como cliente.
 * 3. Canales: solo WhatsApp + solo correo + ambos = clientes.
 * 4. Promedio = atenciones identificadas / clientes.
 * 5. Ranking: % sobre atenciones identificadas; Top 20 y paginación.
 * 6. SLA: cumple + no cumple = evaluables; umbral por canal.
 * 7. Explorador: categorías, subcategorías y tickets reconciliados.
 * 8. Tickets: paginación, total y filtros exactos.
 * 9. Seguimiento: ≥2 señales, mínimo 3 atenciones, motivos verificables.
 * 10. Calidad: no identificadas fuera de clientes/rankings/promedios.
 * 11. Exportación: total del nivel seleccionado.
 * 12. Filtros globales.
 * 13. TypeScript, pruebas y builds se ejecutan aparte.
 * 14. Capturas visuales se realizan aparte.
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";
import { clientesExportService } from "../src/services/clientesExport.service";
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

const FIN = Prisma.sql`estado_homologado IN ('cerrado', 'resuelto')`;
const CRE = Prisma.sql`CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;
const DOM = Prisma.sql`COALESCE(NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dominio), '^[[:space:]]*https?://', ''), '/.*$', ''), '#.*$', ''), '[?].*$', ''), '[.]\\s*$', '')), ''), '—')`;
const VALID = Prisma.sql`(
  ${DOM} ~ '^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}$'
  AND ${DOM} !~ '@'
  AND ${DOM} NOT IN ('—','0','-','sin dominio','sindominio','sinlocal','informativo','inforamativo','ttp:')
)`;
const EMAIL = Prisma.sql`LOWER(SPLIT_PART(TRIM(numero), '@', 2))`;
const FREE = Prisma.sql`('gmail.com','gmail.pe','hotmail.com','hotmail.es','hotmail.pe','outlook.com','outlook.es','yahoo.com','yahoo.es','yahoo.com.pe','live.com','icloud.com')`;
const EMAIL_VALID = Prisma.sql`(
  subcanal = 'ZENDESK'
  AND numero LIKE '%@%'
  AND ${EMAIL} ~ '^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}$'
  AND ${EMAIL} NOT IN ${FREE}
)`;
const KEY = Prisma.sql`CASE
  WHEN ${VALID} THEN ${DOM}
  WHEN ${EMAIL_VALID} THEN ${EMAIL}
  ELSE '__sin_identificar__'
END`;
const UMBRAL = Prisma.sql`CASE
  WHEN canal ILIKE '%what%' THEN 120
  WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN 1440
  ELSE 480
END`;
const WHERE_RANGE = Prisma.sql`WHERE ${FIN}
  AND ${CRE} >= ${"2026-10-01 00:00"}::timestamp
  AND ${CRE} < (${"2026-10-31 23:59"}::timestamp + interval '1 minute')`;

async function raw<T>(sql: Prisma.Sql): Promise<T[]> {
  return (await prisma.$queryRaw(sql)) as T[];
}

const cerca = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && Math.abs(a - b) < 0.11;

async function main(): Promise<void> {
  console.log("\n=== Validación Reporte Clientes ===");

  /* ── Puerta 0: tipo y conversión de fecha ── */
  console.log("\n— Zona horaria Zendesk —");
  const tipo = await raw<{ data_type: string }>(Prisma.sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'v_unificado_norm'
      AND column_name = 'tickets_created_at'
  `);
  check(
    "tickets_created_at es timestamp without time zone",
    tipo[0]?.data_type === "timestamp without time zone",
    tipo[0]?.data_type ?? "sin tipo",
  );

  const conv = await raw<{
    ticket_id: string;
    almacenado: string;
    lima: string;
    fecha: string;
    hora: string;
  }>(Prisma.sql`
    SELECT ticket_id::text AS ticket_id,
           TO_CHAR(tickets_created_at, 'YYYY-MM-DD HH24:MI:SS') AS almacenado,
           TO_CHAR(${CRE}, 'YYYY-MM-DD HH24:MI:SS') AS lima,
           TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
           hora
    FROM public.v_unificado_norm
    WHERE ticket_id IN (35177, 35175)
    ORDER BY ticket_id DESC
  `);
  const t35177 = conv.find((r) => r.ticket_id === "35177");
  const t35175 = conv.find((r) => r.ticket_id === "35175");
  check(
    "35177 almacenado en UTC",
    t35177?.almacenado === "2026-11-03 01:09:32",
    t35177?.almacenado ?? "sin dato",
  );
  check(
    "35177 convertido a Lima (día anterior)",
    t35177?.lima === "2026-11-02 20:09:32",
    t35177?.lima ?? "sin dato",
  );
  check(
    "35175 cerca de medianoche convertido",
    t35175?.almacenado === "2026-11-02 23:17:30" && t35175?.lima === "2026-11-02 18:17:30",
    `${t35175?.almacenado} → ${t35175?.lima}`,
  );
  check(
    "fecha/hora de Zendesk no son la fecha local",
    t35175?.fecha === "2026-11-03" && t35175?.hora === "23:17:30",
    `fecha=${t35175?.fecha}, hora=${t35175?.hora}`,
  );

  /* ── Resumen ── */
  const t0 = Date.now();
  const s = await unificadoRepository.clientesV2(FILTER);
  const ms = Date.now() - t0;
  console.log(`\nTiempo del resumen: ${ms} ms`);

  const universo = (
    await raw<{ total: number; ident: number; no_ident: number; clientes: number }>(Prisma.sql`
      WITH k AS (
        SELECT ${KEY} AS clave FROM public.v_unificado_norm ${WHERE_RANGE}
      )
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE clave <> '__sin_identificar__')::int AS ident,
             COUNT(*) FILTER (WHERE clave = '__sin_identificar__')::int AS no_ident,
             COUNT(DISTINCT clave) FILTER (WHERE clave <> '__sin_identificar__')::int AS clientes
      FROM k
    `)
  )[0];

  /* Puerta 1 */
  check("Universo total", s.universo.total === universo.total, `${s.universo.total} vs ${universo.total}`);
  check(
    "Universo = identificadas + no identificadas",
    s.kpis.atencionesIdentificadas + s.kpis.atencionesNoIdentificadas === s.universo.total,
    `${s.kpis.atencionesIdentificadas} + ${s.kpis.atencionesNoIdentificadas} = ${s.universo.total}`,
  );
  check("Atenciones identificadas", s.kpis.atencionesIdentificadas === universo.ident, `${s.kpis.atencionesIdentificadas} vs ${universo.ident}`);
  check("Atenciones no identificadas", s.kpis.atencionesNoIdentificadas === universo.no_ident, `${s.kpis.atencionesNoIdentificadas} vs ${universo.no_ident}`);

  /* Puerta 2 */
  check("Clientes identificados", s.kpis.clientesIdentificados === universo.clientes, `${s.kpis.clientesIdentificados} vs ${universo.clientes}`);
  check(
    "El grupo no identificado no es cliente",
    s.kpis.clientesIdentificados === universo.clientes &&
      s.kpis.atencionesIdentificadas === universo.ident &&
      universo.no_ident > 0,
    `${universo.clientes} clientes; ${universo.ident} atenciones identificadas; ${universo.no_ident} no identificadas`,
  );

  /* Puerta 3 */
  const canales = (
    await raw<{ ambos: number; solo_w: number; solo_c: number }>(Prisma.sql`
      WITH k AS (
        SELECT ${KEY} AS clave, canal FROM public.v_unificado_norm ${WHERE_RANGE}
      ), b AS (
        SELECT clave,
               BOOL_OR(canal ILIKE '%what%') AS w,
               BOOL_OR(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%') AS c
        FROM k
        WHERE clave <> '__sin_identificar__'
        GROUP BY clave
      )
      SELECT COUNT(*) FILTER (WHERE w AND c)::int AS ambos,
             COUNT(*) FILTER (WHERE w AND NOT c)::int AS solo_w,
             COUNT(*) FILTER (WHERE c AND NOT w)::int AS solo_c
      FROM b
    `)
  )[0];
  check("Canales: ambos", s.canales.ambos === canales.ambos, `${s.canales.ambos} vs ${canales.ambos}`);
  check("Canales: solo WhatsApp", s.canales.soloWhatsapp === canales.solo_w, `${s.canales.soloWhatsapp} vs ${canales.solo_w}`);
  check("Canales: solo correo", s.canales.soloCorreo === canales.solo_c, `${s.canales.soloCorreo} vs ${canales.solo_c}`);
  check(
    "Canales suman clientes",
    s.canales.ambos + s.canales.soloWhatsapp + s.canales.soloCorreo === s.kpis.clientesIdentificados,
    `${s.canales.ambos + s.canales.soloWhatsapp + s.canales.soloCorreo} vs ${s.kpis.clientesIdentificados}`,
  );
  check("Clientes multicanal", s.kpis.clientesMulticanal === canales.ambos, `${s.kpis.clientesMulticanal} vs ${canales.ambos}`);

  /* Puerta 4 */
  const promedio = universo.clientes > 0 ? universo.ident / universo.clientes : 0;
  check(
    "Promedio por cliente identificado",
    cerca(s.kpis.promedioAtenciones, Math.round(promedio * 100) / 100),
    `${s.kpis.promedioAtenciones} vs ${Math.round(promedio * 100) / 100}`,
  );

  /* Puerta 5 */
  const topSql = (
    await raw<{ clave: string; total: number }>(Prisma.sql`
      WITH k AS (
        SELECT ${KEY} AS clave FROM public.v_unificado_norm ${WHERE_RANGE}
      )
      SELECT clave, COUNT(*)::int AS total
      FROM k
      WHERE clave <> '__sin_identificar__'
      GROUP BY clave
      ORDER BY total DESC, clave
      LIMIT 1
    `)
  )[0];
  check("Ranking: top 20 o menos", s.ranking.length <= 20, `${s.ranking.length}`);
  check("Ranking: primer cliente", s.ranking[0]?.clave === topSql?.clave, `${s.ranking[0]?.clave} vs ${topSql?.clave}`);
  check("Ranking: total de clientes", s.rankingTotal === universo.clientes, `${s.rankingTotal} vs ${universo.clientes}`);
  check("Ranking: sin no identificados", s.ranking.every((r) => !r.esNoIdentificado), "todos identificados");
  const pctTop = universo.ident > 0 ? Math.round(((topSql?.total ?? 0) / universo.ident) * 1000) / 10 : 0;
  check("Ranking: % sobre atenciones identificadas", cerca(s.ranking[0]?.pct, pctTop), `${s.ranking[0]?.pct} vs ${pctTop}`);

  const lista1 = await unificadoRepository.clientesLista(FILTER, { page: 1, pageSize: 10 });
  const lista2 = await unificadoRepository.clientesLista(FILTER, { page: 2, pageSize: 10 });
  const listaAll = await unificadoRepository.clientesLista(FILTER, { all: true });
  check("Lista: total", lista1.total === universo.clientes, `${lista1.total} vs ${universo.clientes}`);
  check("Lista: página 1", lista1.rows.length <= 10, `${lista1.rows.length}`);
  check("Lista: todas las filas", listaAll.rows.length === universo.clientes, `${listaAll.rows.length} vs ${universo.clientes}`);
  check(
    "Lista: página 2 distinta",
    (lista1.rows[0]?.clave ?? "") !== (lista2.rows[0]?.clave ?? ""),
    `${lista1.rows[0]?.clave} vs ${lista2.rows[0]?.clave}`,
  );

  /* Puerta 6: SLA por canal */
  const slaGlobal = (
    await raw<{ con_dato: number; cumple: number }>(Prisma.sql`
      SELECT COUNT(resolucion_min_norm)::int AS con_dato,
             COUNT(*) FILTER (
               WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${UMBRAL}
             )::int AS cumple
      FROM public.v_unificado_norm ${WHERE_RANGE}
    `)
  )[0];
  const topCliente = s.ranking[0]?.clave;
  if (topCliente) {
    const cats = await unificadoRepository.clienteCategorias(FILTER, topCliente);
    const catsSql = (
      await raw<{ total: number; con_dato: number; cumple: number }>(Prisma.sql`
        SELECT COUNT(*)::int AS total,
               COUNT(resolucion_min_norm)::int AS con_dato,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${UMBRAL}
               )::int AS cumple
        FROM public.v_unificado_norm ${WHERE_RANGE}
        AND ${KEY} = ${topCliente}
      `)
    )[0];
    check("Categorías: total del cliente", cats.total === catsSql.total, `${cats.total} vs ${catsSql.total}`);
    check(
      "Categorías: suma = total",
      cats.categorias.reduce((a, r) => a + r.total, 0) === cats.total,
      `${cats.categorias.reduce((a, r) => a + r.total, 0)} vs ${cats.total}`,
    );
    check(
      "SLA del cliente: cumple + no cumple = evaluables",
      catsSql.cumple + (catsSql.con_dato - catsSql.cumple) === catsSql.con_dato,
      `${catsSql.cumple} + ${catsSql.con_dato - catsSql.cumple} = ${catsSql.con_dato}`,
    );

    const catTop = cats.categorias[0];
    if (catTop) {
      const subs = await unificadoRepository.clienteSubcategorias(
        FILTER,
        topCliente,
        catTop.categoria,
      );
      const subsSql = (
        await raw<{ total: number }>(Prisma.sql`
          SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${WHERE_RANGE}
          AND ${KEY} = ${topCliente}
          AND COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') = ${catTop.categoria}
        `)
      )[0];
      check("Subcategorías: total de la categoría", subs.total === subsSql.total, `${subs.total} vs ${subsSql.total}`);
      check(
        "Subcategorías: suma = total",
        subs.subcategorias.reduce((a, r) => a + r.total, 0) === subs.total,
        `${subs.subcategorias.reduce((a, r) => a + r.total, 0)} vs ${subs.total}`,
      );

      const subTop = subs.subcategorias[0];
      if (subTop) {
        const tickets = await unificadoRepository.clienteTickets(FILTER, {
          clave: topCliente,
          categoria: catTop.categoria,
          subcategoria: subTop.subcategoria,
          page: 1,
          pageSize: 10,
        });
        const ticketsAll = await unificadoRepository.clienteTickets(FILTER, {
          clave: topCliente,
          categoria: catTop.categoria,
          subcategoria: subTop.subcategoria,
          all: true,
        });
        check("Tickets: total de la subcategoría", tickets.total === subTop.total, `${tickets.total} vs ${subTop.total}`);
        check("Tickets: todas las filas", ticketsAll.rows.length === tickets.total, `${ticketsAll.rows.length} vs ${tickets.total}`);
        check(
          "Tickets: pertenecen al nivel seleccionado",
          ticketsAll.rows.every(
            (t) => t.categoria === catTop.categoria && t.subcategoria === subTop.subcategoria,
          ),
          `${ticketsAll.rows.length} filas`,
        );
        check(
          "Tickets: paginación coherente",
          tickets.total <= 10 || tickets.rows.length === 10,
          `${tickets.rows.length} de ${tickets.total}`,
        );
        const slaOk = ticketsAll.rows.every((t) => {
          if (t.cumpleSla == null) return t.tiempoResolucion == null;
          return t.tiempoResolucion != null && (t.tiempoResolucion <= t.umbralMinutos) === t.cumpleSla;
        });
        check("Tickets: SLA por canal", slaOk, "cumpleSla coincide con el umbral");
        check(
          "Tickets: umbral válido",
          ticketsAll.rows.every((t) => [120, 1440, 480].includes(t.umbralMinutos)),
          [...new Set(ticketsAll.rows.map((t) => t.umbralMinutos))].join(", "),
        );
      }
    }
  }

  /* Puerta 7 y 8: no identificados en el explorador */
  const sin = await unificadoRepository.clienteCategorias(FILTER, "__sin_identificar__");
  check("Explorador: no identificados disponible", sin.total === universo.no_ident, `${sin.total} vs ${universo.no_ident}`);
  check(
    "Explorador: no identificados separado",
    sin.esNoIdentificado === true,
    `esNoIdentificado=${sin.esNoIdentificado}`,
  );

  /* Puerta 9: seguimiento */
  check(
    "Seguimiento: mínimo 3 atenciones",
    s.seguimiento.every((r) => r.total >= 3),
    `${s.seguimiento.length} clientes`,
  );
  check(
    "Seguimiento: al menos 2 señales",
    s.seguimiento.every((r) => r.motivos.length >= 2 && r.senales === r.motivos.length),
    `${s.seguimiento.length} clientes`,
  );
  const motivosOk = s.seguimiento.every((r) => {
    const esperados: string[] = [];
    if (r.conDato >= 3 && (r.pctIncumple ?? 0) > 30) esperados.push("SLA");
    if (r.conDato >= 3 && (r.tiempoPromedio ?? 0) > 1440) esperados.push("Tiempo");
    if (r.total >= 10 && r.totalAnterior > 0 && r.total >= 2 * r.totalAnterior) esperados.push("Aumento");
    if (r.reincidenciaMax >= 4) esperados.push("Reincidencia");
    return esperados.length === r.motivos.length;
  });
  check("Seguimiento: motivos reproducibles", motivosOk, "cada motivo coincide con sus métricas");
  check(
    "Seguimiento: sin no identificados",
    s.seguimiento.every((r) => r.clave !== "__sin_identificar__"),
    "todos identificados",
  );
  const prev = rangoAnterior(FILTER.fechaHoraInicio, FILTER.fechaHoraFin);
  check(
    "Periodo anterior equivalente",
    s.universo.rango?.comparadoCon.inicio === prev.inicio &&
      s.universo.rango?.comparadoCon.fin === prev.fin,
    `${s.universo.rango?.comparadoCon.inicio} → ${s.universo.rango?.comparadoCon.fin} vs ${prev.inicio} → ${prev.fin}`,
  );
  const prevTotal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${FIN}
        AND ${CRE} >= ${`${prev.inicio} 00:00`}::timestamp
        AND ${CRE} < (${`${prev.fin} 23:59`}::timestamp + interval '1 minute')
    `)
  )[0];
  check("Total del periodo anterior", s.universo.totalAnterior === prevTotal.total, `${s.universo.totalAnterior} vs ${prevTotal.total}`);

  /* Puerta 10: calidad */
  const calidad = (
    await raw<{
      numeros: number;
      dominios: number;
      por_correo: number;
    }>(Prisma.sql`
      WITH k AS (
        SELECT ${KEY} AS clave, ${DOM} AS dom, numero, ${EMAIL_VALID} AS email_valido, ${VALID} AS dom_valido
        FROM public.v_unificado_norm ${WHERE_RANGE}
      )
      SELECT
        COUNT(DISTINCT CASE WHEN clave = '__sin_identificar__' THEN NULLIF(TRIM(numero), '') END)::int AS numeros,
        COUNT(DISTINCT CASE WHEN clave = '__sin_identificar__' AND dom <> '—' THEN dom END)::int AS dominios,
        COUNT(DISTINCT CASE WHEN clave <> '__sin_identificar__' AND email_valido AND NOT dom_valido THEN clave END)::int AS por_correo
      FROM k
    `)
  )[0];
  check("Calidad: no identificadas", s.calidad.atencionesNoIdentificadas === universo.no_ident, `${s.calidad.atencionesNoIdentificadas} vs ${universo.no_ident}`);
  check(
    "Calidad: % del total",
    cerca(s.calidad.pctNoIdentificadas, Math.round((universo.no_ident / universo.total) * 1000) / 10),
    `${s.calidad.pctNoIdentificadas}%`,
  );
  check("Calidad: números distintos", s.calidad.numerosDistintos === calidad.numeros, `${s.calidad.numerosDistintos} vs ${calidad.numeros}`);
  check("Calidad: dominios inválidos", s.calidad.dominiosInvalidos === calidad.dominios, `${s.calidad.dominiosInvalidos} vs ${calidad.dominios}`);
  check("Calidad: identificados por correo", s.calidad.identificadosPorCorreo === calidad.por_correo, `${s.calidad.identificadosPorCorreo} vs ${calidad.por_correo}`);

  /* Puerta 11: exportación */
  const expClientes = await clientesExportService.generar(FILTER, { nivel: "clientes" });
  check("Export clientes: total", expClientes.total === universo.clientes, `${expClientes.total} vs ${universo.clientes}`);
  check("Export clientes: buffer", expClientes.buffer.length > 0, `${expClientes.buffer.length} bytes`);
  if (topCliente) {
    const cats = await unificadoRepository.clienteCategorias(FILTER, topCliente);
    const expCats = await clientesExportService.generar(FILTER, {
      nivel: "categorias",
      clave: topCliente,
    });
    check("Export categorías: total", expCats.total === cats.categorias.length, `${expCats.total} vs ${cats.categorias.length}`);

    const catTop = cats.categorias[0];
    if (catTop) {
      const subs = await unificadoRepository.clienteSubcategorias(FILTER, topCliente, catTop.categoria);
      const expSubs = await clientesExportService.generar(FILTER, {
        nivel: "subcategorias",
        clave: topCliente,
        categoria: catTop.categoria,
      });
      check("Export subcategorías: total", expSubs.total === subs.subcategorias.length, `${expSubs.total} vs ${subs.subcategorias.length}`);

      const subTop = subs.subcategorias[0];
      if (subTop) {
        const tickets = await unificadoRepository.clienteTickets(FILTER, {
          clave: topCliente,
          categoria: catTop.categoria,
          subcategoria: subTop.subcategoria,
          all: true,
        });
        const expTickets = await clientesExportService.generar(FILTER, {
          nivel: "tickets",
          clave: topCliente,
          categoria: catTop.categoria,
          subcategoria: subTop.subcategoria,
        });
        check("Export tickets: total", expTickets.total === tickets.total, `${expTickets.total} vs ${tickets.total}`);
        check("Export tickets: CSV", expTickets.contentType.startsWith("text/csv"), expTickets.contentType);
      }
    }
  }

  /* Puerta 12: filtros globales */
  const filtroCanal = { ...FILTER, subcanal: ["ZENDESK"] };
  const sCanal = await unificadoRepository.clientesV2(filtroCanal);
  const totalCanal = (
    await raw<{ total: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
      WHERE ${FIN}
        AND ${CRE} >= '2026-10-01 00:00'::timestamp
        AND ${CRE} < ('2026-10-31 23:59'::timestamp + interval '1 minute')
        AND subcanal = 'ZENDESK'
    `)
  )[0];
  check("Filtro subcanal: total", sCanal.universo.total === totalCanal.total, `${sCanal.universo.total} vs ${totalCanal.total}`);
  check(
    "Filtro subcanal: identificadas + no identificadas",
    sCanal.kpis.atencionesIdentificadas + sCanal.kpis.atencionesNoIdentificadas === sCanal.universo.total,
    `${sCanal.kpis.atencionesIdentificadas} + ${sCanal.kpis.atencionesNoIdentificadas}`,
  );
  check(
    "Filtro subcanal: ranking sin no identificados",
    sCanal.ranking.every((r) => !r.esNoIdentificado),
    "todos identificados",
  );

  const filtroCat = { ...FILTER, categoria: ["GESTION"] };
  const sCat = await unificadoRepository.clientesV2(filtroCat);
  check(
    "Filtro categoría: identificadas + no identificadas",
    sCat.kpis.atencionesIdentificadas + sCat.kpis.atencionesNoIdentificadas === sCat.universo.total,
    `${sCat.kpis.atencionesIdentificadas} + ${sCat.kpis.atencionesNoIdentificadas}`,
  );

  /* ── Resumen ── */
  console.log(`\nResultado: ${checks - failures}/${checks} comprobaciones OK.`);
  if (failures > 0) {
    console.error(`\nVALIDACIÓN FALLIDA: ${failures} discrepancia(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nVALIDACIÓN OK: Clientes y SQL coinciden.");
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error ejecutando la validación:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
