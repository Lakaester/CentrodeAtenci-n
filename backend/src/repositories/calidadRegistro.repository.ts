/**
 * Repositorio del módulo Calidad de Registro.
 *
 * Fuente única: public.v_unificado_norm.
 * Solo lectura: no modifica vistas, tablas, homologación ni registros.
 *
 * Invariantes garantizadas por construcción:
 *  - cat_hom = 1 solo si cat_reg = 1 y la categoría existe en el catálogo.
 *  - dom_val = 1 solo si dom_inf = 1 y cumple isValidDomainFormat.
 *  - Los cuatro escenarios son exhaustivos y mutuamente excluyentes.
 *
 * Rendimiento: una sola lectura de la vista cubre el rango actual y el anterior.
 * El catálogo de homologación se pasa como array (13 valores) para evitar
 * normalizar `categoria` fila por fila.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { DashboardFilters } from "../types";
import type {
  CalidadAggRow,
  CalidadCanal,
  CalidadFila,
  CalidadPeriodo,
  CalidadRegistroResponse,
  CalidadResumen,
  Granularidad,
} from "../types/calidadRegistro";
import { construirWhere, rangoAnterior } from "../utils/filtros";
import {
  CANAL_ORDER,
  agregarConteos,
  calcularResumen,
  calcularVariaciones,
  conteosVacios,
  etiquetaCanal,
  etiquetaPeriodo,
  finPeriodo,
  generarPeriodos,
  type ConteosCalidad,
} from "../utils/calidadRegistro";

/**
 * Categoría registrada: texto de origen válido, excluyendo marcadores explícitos.
 * Se usa una normalización barata (trim, lower, guiones bajos) para no llamar
 * a normalizar_texto/unaccent en cada fila. Los marcadores están cubiertos con
 * sus variantes con y sin tilde.
 */
export const CATEGORIA_REGISTRADA_SQL = Prisma.sql`CASE
  WHEN v.categoria IS NULL OR BTRIM(v.categoria) = '' THEN 0
  WHEN UPPER(BTRIM(v.categoria)) = 'SIN CATEGORIA EN ORIGEN' THEN 0
  WHEN LOWER(BTRIM(REPLACE(v.subcategoria, '_', ' '))) IN (
    '', 'sin categorizar', 'sin categoría', 'sin categoria',
    'no categorizado', 'no categorizada', 'sin clasificar',
    'sin homologar', 'sin asignar', 'sin definir',
    'n a', 'na', 'sin dato', 'sin datos'
  ) THEN 0
  ELSE 1
END`;

/**
 * Hostname normalizado, espejo SQL de normalizeDomain().
 * Referencia: backend/src/domain/contacto/normalizacion.ts.
 */
export const DOMINIO_HOST_SQL = Prisma.sql`CASE
  WHEN v.dominio IS NULL OR BTRIM(v.dominio) = '' THEN NULL
  WHEN LOWER(BTRIM(v.dominio)) ~ '^[a-z0-9-]+(\\.[a-z0-9-]+)+$'
    THEN LOWER(BTRIM(v.dominio))
  ELSE NULLIF(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(LOWER(BTRIM(v.dominio)), '^[a-z][a-z0-9+.-]*://', ''),
            '#.*$', ''),
          '[?].*$', ''),
        '/.*$', ''),
      '[[:space:]]+', '', 'g'),
    '\\.+$', ''),
  '')
END`;

/**
 * Espejo SQL de isValidDomainFormat() sobre la columna `host`.
 * Referencia: backend/src/domain/contacto/normalizacion.ts.
 */
export const DOMINIO_FORMATO_SQL = Prisma.sql`(
  host ~ '^[a-z0-9-]+(\\.[a-z0-9-]+)+$'
  AND host ~ '^[a-z0-9-]+\\.'
  AND LENGTH(SPLIT_PART(host, '.', -1)) >= 2
  AND LENGTH(host) >= 4
)`;

const CATALOGO_TTL_MS = 5 * 60 * 1000;
let catalogoCache: { valores: string[]; actualizadoEn: number } | null = null;

async function getCategoriasValidas(): Promise<string[]> {
  if (catalogoCache && Date.now() - catalogoCache.actualizadoEn < CATALOGO_TTL_MS) {
    return catalogoCache.valores;
  }
  const rows = (await prisma.$queryRaw`
    SELECT DISTINCT categoria
    FROM public.vw_homologacion_categorias
    WHERE categoria IS NOT NULL
  `) as { categoria: string }[];
  const valores = rows.map((r) => r.categoria);
  catalogoCache = { valores, actualizadoEn: Date.now() };
  return valores;
}

function bucketStartSql(g: Granularidad): Prisma.Sql {
  if (g === "semana") return Prisma.sql`date_trunc('week', v.fecha::date)::date`;
  if (g === "mes") return Prisma.sql`date_trunc('month', v.fecha::date)::date`;
  return Prisma.sql`date_trunc('quarter', v.fecha::date)::date`;
}

function bucketLabelSql(g: Granularidad): Prisma.Sql {
  if (g === "semana") return Prisma.sql`to_char(v.fecha::date, 'IYYY-"W"IW')`;
  if (g === "mes") return Prisma.sql`to_char(v.fecha::date, 'YYYY-MM')`;
  return Prisma.sql`to_char(v.fecha::date, 'YYYY-"T"Q')`;
}

interface RangoFechas {
  inicio: string;
  fin: string;
}

async function queryAgg(
  filters: DashboardFilters,
  granularidad: Granularidad,
  actual: RangoFechas,
  previo: RangoFechas | null,
): Promise<CalidadAggRow[]> {
  const categorias = await getCategoriasValidas();
  const bucketStart = bucketStartSql(granularidad);
  const bucketLabel = bucketLabelSql(granularidad);

  // Una sola lectura: desde el inicio del rango anterior hasta el fin del actual.
  const broadInicio = previo ? `${previo.inicio} 00:00` : filters.fechaHoraInicio;
  const broadFin = `${actual.fin} 23:59`;
  const where = construirWhere(
    { ...filters, fechaHoraInicio: broadInicio, fechaHoraFin: broadFin },
    { endExclusive: true },
  );

  const sql = Prisma.sql`
    WITH normalizado AS (
      SELECT
        v.fecha::date AS fecha,
        v.subcanal,
        v.ticket_id,
        to_char(${bucketStart}, 'YYYY-MM-DD') AS periodo_inicio,
        ${bucketLabel} AS periodo,
        ${CATEGORIA_REGISTRADA_SQL} AS cat_reg,
        v.categoria AS categoria_origen,
        CASE WHEN NULLIF(BTRIM(v.dominio), '') IS NOT NULL THEN 1 ELSE 0 END AS dom_inf,
        ${DOMINIO_HOST_SQL} AS host,
        CASE
          WHEN (v.fecha::date + v.hora::time) >= ${actual.inicio}::date::timestamp
           AND (v.fecha::date + v.hora::time) < (${actual.fin}::date + interval '1 day')
          THEN 'actual'
          ELSE 'previo'
        END AS tipo_rango,
        CASE
          WHEN UPPER(BTRIM(v.subcanal)) = 'ZENDESK'
            THEN 'ZENDESK:' || v.ticket_id::text
          ELSE 'WA:' || v.ticket_id::text
        END AS atencion_key
      FROM public.v_unificado_norm v
      ${where}
    ),
    base AS (
      SELECT *,
        CASE WHEN cat_reg = 1 AND categoria_origen = ANY(${categorias}) THEN 1 ELSE 0 END AS cat_hom,
        CASE WHEN dom_inf = 1 AND ${DOMINIO_FORMATO_SQL} THEN 1 ELSE 0 END AS dom_val
      FROM normalizado
    ),
    escenarios AS MATERIALIZED (
      SELECT *,
        CASE WHEN cat_hom = 1 AND dom_val = 1 THEN 1 ELSE 0 END AS ambas,
        CASE WHEN cat_hom = 1 AND dom_val = 0 THEN 1 ELSE 0 END AS solo_cat,
        CASE WHEN cat_hom = 0 AND dom_val = 1 THEN 1 ELSE 0 END AS solo_dom,
        CASE WHEN cat_hom = 0 AND dom_val = 0 THEN 1 ELSE 0 END AS ninguna
      FROM base
    ),
    dedup AS (
      SELECT DISTINCT ON (tipo_rango, atencion_key) *
      FROM escenarios
      ORDER BY tipo_rango, atencion_key,
               cat_hom DESC, dom_val DESC, cat_reg DESC, dom_inf DESC,
               fecha DESC, subcanal
    ),
    canal AS (
      SELECT tipo_rango, periodo_inicio, periodo, subcanal,
             COUNT(*)::int AS total,
             SUM(cat_reg)::int AS cat_reg,
             SUM(cat_hom)::int AS cat_hom,
             SUM(dom_inf)::int AS dom_inf,
             SUM(dom_val)::int AS dom_val,
             SUM(ambas)::int AS ambas,
             SUM(solo_cat)::int AS solo_cat,
             SUM(solo_dom)::int AS solo_dom,
             SUM(ninguna)::int AS ninguna
      FROM escenarios
      GROUP BY tipo_rango, periodo_inicio, periodo, subcanal
    ),
    consolidado AS (
      SELECT tipo_rango, periodo_inicio, periodo,
             COUNT(*)::int AS total,
             SUM(cat_reg)::int AS cat_reg,
             SUM(cat_hom)::int AS cat_hom,
             SUM(dom_inf)::int AS dom_inf,
             SUM(dom_val)::int AS dom_val,
             SUM(ambas)::int AS ambas,
             SUM(solo_cat)::int AS solo_cat,
             SUM(solo_dom)::int AS solo_dom,
             SUM(ninguna)::int AS ninguna
      FROM dedup
      GROUP BY tipo_rango, periodo_inicio, periodo
    )
    SELECT 'canal' AS nivel, tipo_rango, periodo_inicio, periodo, subcanal,
           total, cat_reg, cat_hom, dom_inf, dom_val,
           ambas, solo_cat, solo_dom, ninguna
    FROM canal
    UNION ALL
    SELECT 'consolidado' AS nivel, tipo_rango, periodo_inicio, periodo, NULL::text AS subcanal,
           total, cat_reg, cat_hom, dom_inf, dom_val,
           ambas, solo_cat, solo_dom, ninguna
    FROM consolidado
    ORDER BY tipo_rango, periodo_inicio, nivel, subcanal
  `;

  const result = (await prisma.$queryRaw(sql)) as CalidadAggRow[];
  return result;
}

function conteosDe(row?: CalidadAggRow): ConteosCalidad {
  if (!row) return conteosVacios();
  return {
    total: row.total,
    catReg: row.cat_reg,
    catHom: row.cat_hom,
    domInf: row.dom_inf,
    domVal: row.dom_val,
    ambas: row.ambas,
    soloCat: row.solo_cat,
    soloDom: row.solo_dom,
    ninguna: row.ninguna,
  };
}

function construirSerie(
  rows: CalidadAggRow[],
  granularidad: Granularidad,
  rango?: { inicio: string; fin: string },
): CalidadPeriodo[] {
  const map = new Map(rows.map((r) => [r.periodo_inicio, r]));
  const ordenados = [...rows].sort((a, b) => a.periodo_inicio.localeCompare(b.periodo_inicio));
  const inicio = rango?.inicio ?? ordenados[0]?.periodo_inicio;
  const fin = rango?.fin ?? ordenados[ordenados.length - 1]?.periodo_inicio;
  if (!inicio || !fin) return [];

  const starts = generarPeriodos(inicio, fin, granularidad);
  let anterior: CalidadResumen | null = null;
  return starts.map((start) => {
    const row = map.get(start);
    const resumen = calcularResumen(conteosDe(row));
    const item: CalidadPeriodo = {
      periodo: row?.periodo ?? etiquetaPeriodo(start, granularidad),
      periodoInicio: start,
      periodoFin: finPeriodo(start, granularidad),
      ...resumen,
      variacion: calcularVariaciones(resumen, anterior),
    };
    anterior = resumen;
    return item;
  });
}

function canalesSeleccionados(filters: DashboardFilters): string[] {
  const solicitados = (filters.subcanal ?? [])
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (!solicitados.length) return [...CANAL_ORDER];
  return CANAL_ORDER.filter((c) => solicitados.includes(c));
}

export const calidadRegistroRepository = {
  async obtener(
    filters: DashboardFilters,
    granularidad: Granularidad,
  ): Promise<CalidadRegistroResponse> {
    const inicio = filters.fechaHoraInicio?.slice(0, 10) ?? null;
    const fin = filters.fechaHoraFin?.slice(0, 10) ?? null;
    const previo = inicio && fin ? rangoAnterior(inicio, fin) : null;

    const actual: RangoFechas = {
      inicio: inicio ?? "1900-01-01",
      fin: fin ?? "2999-12-31",
    };

    const rows = await queryAgg(filters, granularidad, actual, previo);
    const rowsActual = rows.filter((r) => r.tipo_rango === "actual");
    const rowsPrevio = rows.filter((r) => r.tipo_rango === "previo");

    const canalActual = rowsActual.filter((r) => r.nivel === "canal");
    const consolidadoActual = rowsActual.filter((r) => r.nivel === "consolidado");
    const canalPrevio = rowsPrevio.filter((r) => r.nivel === "canal");
    const consolidadoPrevio = rowsPrevio.filter((r) => r.nivel === "consolidado");

    const resumenActual = calcularResumen(
      agregarConteos(consolidadoActual.map(conteosDe)),
    );
    const resumenAnterior = previo
      ? calcularResumen(agregarConteos(consolidadoPrevio.map(conteosDe)))
      : null;

    const evolucion = construirSerie(consolidadoActual, granularidad);
    const rangoSerie = evolucion.length
      ? {
          inicio: evolucion[0].periodoInicio,
          fin: evolucion[evolucion.length - 1].periodoInicio,
        }
      : undefined;

    const canales = canalesSeleccionados(filters);

    const evolucionPorCanal = canales.map((canal) => ({
      canal,
      canalLabel: etiquetaCanal(canal),
      periodos: construirSerie(
        canalActual.filter((r) => r.subcanal === canal),
        granularidad,
        rangoSerie,
      ),
    }));

    const comparativo: CalidadCanal[] = canales.map((canal) => {
      const actualCanal = calcularResumen(
        agregarConteos(
          canalActual.filter((r) => r.subcanal === canal).map(conteosDe),
        ),
      );
      const anteriorCanal = previo
        ? calcularResumen(
            agregarConteos(
              canalPrevio.filter((r) => r.subcanal === canal).map(conteosDe),
            ),
          )
        : null;
      return {
        ...actualCanal,
        canal,
        canalLabel: etiquetaCanal(canal),
        variacion: calcularVariaciones(actualCanal, anteriorCanal),
      };
    });

    const tabla: CalidadFila[] = [];
    for (const periodo of evolucion) {
      tabla.push({ ...periodo, canal: "TODOS", canalLabel: "TODOS" });
      for (const serie of evolucionPorCanal) {
        const filaCanal = serie.periodos.find(
          (p) => p.periodoInicio === periodo.periodoInicio,
        );
        if (filaCanal) {
          tabla.push({
            ...filaCanal,
            canal: serie.canal,
            canalLabel: serie.canalLabel,
          });
        }
      }
    }

    return {
      rango: {
        inicio,
        fin,
        comparadoCon: previo,
      },
      granularidad,
      resumen: {
        actual: resumenActual,
        anterior: resumenAnterior,
        variacion: calcularVariaciones(resumenActual, resumenAnterior),
      },
      evolucion,
      evolucionPorCanal,
      comparativo,
      tabla,
      generadoEn: new Date().toISOString(),
    };
  },
};
