/**
 * ActividadCopeRepository — actividad de atenciones desde public.v_unificado_norm.
 *
 * Dos capas separadas:
 * 1) Compatibilidad: métodos existentes sin deduplicar y con la semántica
 *    original (usados por la tabla de locales y el drawer local).
 * 2) COSE: capa nueva, deduplicada por (canal, ticket_id), con período,
 *    filtros y agregados SQL para el panel COSE.
 *
 * No se cambia silenciosamente el comportamiento de la capa de compatibilidad.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizeDomain } from "../domain/contacto/normalizacion";

// ─────────────────────────────────────────────────────────────────────────────
// Capa de compatibilidad (sin deduplicar)
// ─────────────────────────────────────────────────────────────────────────────

export interface ActividadLocalRow {
  localbi_id: string | null;
  dominio: string | null;
  canal: string | null;
  categoria: string | null;
  subcategoria: string | null;
  asesor: string | null;
  estado: string | null;
  fecha: Date;
  contacto: string | null;
  numero: string | null;
}

export interface ActividadResumen {
  total: number;
  canales: { nombre: string; cantidad: number }[];
  categorias: { nombre: string; cantidad: number }[];
  subcategorias: { nombre: string; cantidad: number }[];
  asesores: { nombre: string; cantidad: number }[];
  estados: { nombre: string; cantidad: number }[];
  primera_atencion: string | null;
  ultima_atencion: string | null;
}

/** Normaliza un dominio a su forma canónica (solo hostname). Re-export de la fuente única. */
export const normalizarDominioActividad = normalizeDomain;

/**
 * Normaliza un término de búsqueda a un token plano (minúsculas, sin acentos,
 * sin espacios ni puntuación).
 */
export function normalizarTokenBusqueda(busqueda: string): string {
  return (busqueda || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Expresión SQL que normaliza el dominio igual que JS. */
const NORM_DOMINIO_SQL = Prisma.sql`NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dominio), '^[[:space:]]*https?://', ''), '/.*$', ''), '#.*$', ''), '[?].*$', ''), '[.]\\s*$', '')), '')`;

function agrupar(
  filas: ActividadLocalRow[],
  k: (r: ActividadLocalRow) => string | null,
): { nombre: string; cantidad: number }[] {
  const m = new Map<string, number>();
  for (const f of filas) {
    const v = k(f)?.trim();
    if (!v) continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es"));
}

/** Resumen de compatibilidad: mismos campos y semántica que antes de COSE. */
function armarResumen(filas: ActividadLocalRow[]): ActividadResumen {
  const fechas = filas.map((f) => f.fecha).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
  return {
    total: filas.length,
    canales: agrupar(filas, (r) => r.canal),
    categorias: agrupar(filas, (r) => r.categoria),
    subcategorias: agrupar(filas, (r) => r.subcategoria),
    asesores: agrupar(filas, (r) => r.asesor),
    estados: agrupar(filas, (r) => r.estado),
    primera_atencion: fechas.length ? fechas[0].toISOString() : null,
    ultima_atencion: fechas.length ? fechas[fechas.length - 1].toISOString() : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Capa COSE (deduplicada, con período/filtros y agregados SQL)
// ─────────────────────────────────────────────────────────────────────────────

export interface CoseAtencion {
  ticket_id: string;
  fecha: Date;
  hora: string;
  canal: string | null;
  subcanal: string | null;
  estado: string | null;
  estado_homologado: string | null;
  primera_respuesta_min_norm: number | null;
  resolucion_min_norm: number | null;
  respuesta_promedio_min_norm: number | null;
  rango_atencion: string | null;
  comentario_cierre: string | null;
  tickets_created_at: Date | null;
  tickets_updated_at: Date | null;
  contacto: string | null;
  numero: string | null;
  localbi_id: string | null;
  dominio: string | null;
  categoria: string | null;
  subcategoria: string | null;
  asesor: string | null;
}

export interface CoseIndicadorTiempo {
  n: number;
  promedio: number | null;
  mediana: number | null;
  cobertura: number;
}

export interface CoseResumen {
  total: number;
  sin_local: number;
  duplicados: number;
  canales: { nombre: string; cantidad: number }[];
  categorias: { nombre: string; cantidad: number }[];
  subcategorias: { nombre: string; cantidad: number }[];
  asesores: { nombre: string; cantidad: number }[];
  estados: { nombre: string; cantidad: number }[];
  locales: { localbi_id: string; cantidad: number }[];
  primera_respuesta: CoseIndicadorTiempo;
  resolucion: CoseIndicadorTiempo;
  primera_atencion: string | null;
  ultima_atencion: string | null;
}

export interface CoseOpciones {
  canales: { nombre: string; cantidad: number }[];
  estados: { nombre: string; cantidad: number }[];
  asesores: { nombre: string; cantidad: number }[];
  locales: { localbi_id: string | null; cantidad: number }[];
  sin_local: number;
}

/**
 * Conteos de los chips de filtro. Se calculan aplicando el resto de filtros
 * pero ignorando la dimensión del propio chip, para que sigan siendo
 * navegables después de filtrar.
 */
export interface CoseChips {
  estados: { nombre: string; cantidad: number }[];
  sin_local: number;
}

export interface CoseAgregada {
  resumen: CoseResumen;
  ultimasAtenciones: CoseAtencion[];
  opciones: CoseOpciones;
  chips: CoseChips;
}

export interface CoseFiltros {
  desde?: string;
  hasta?: string;
  localbi_id?: string;
  canal?: string;
  asesor?: string;
  estado?: string;
  q?: string;
  limite?: number;
}

const SIN_LOCAL = "__sin_local__";

const ORDER_DEDUPE = Prisma.sql`
  ORDER BY canal, ticket_id,
    (CASE WHEN comentario_cierre IS NOT NULL AND comentario_cierre <> '' THEN 1 ELSE 0 END) DESC,
    (CASE WHEN localbi_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
    (CASE WHEN primera_respuesta_min_norm IS NOT NULL THEN 1 ELSE 0 END) DESC,
    (CASE WHEN resolucion_min_norm IS NOT NULL THEN 1 ELSE 0 END) DESC,
    (CASE WHEN dominio IS NOT NULL THEN 1 ELSE 0 END) DESC,
    CASE subcanal WHEN 'WHATMETA' THEN 0 WHEN 'WHATICKET' THEN 1 ELSE 2 END,
    subcanal ASC
`;

function whereCose(dominios: string[], fechas: { desde?: string; hasta?: string } = {}): Prisma.Sql {
  const limpios = [...new Set(dominios.map(normalizarDominioActividad).filter(Boolean))];
  if (limpios.length === 0) return Prisma.sql`1 = 0`;
  const cond: Prisma.Sql[] = [Prisma.sql`${NORM_DOMINIO_SQL} = ANY(${limpios})`];
  if (fechas.desde) cond.push(Prisma.sql`fecha >= ${fechas.desde}::date`);
  if (fechas.hasta) cond.push(Prisma.sql`fecha <= ${fechas.hasta}::date`);
  return Prisma.join(cond, " AND ");
}

function whereFiltros(f: CoseFiltros): Prisma.Sql {
  const cond: Prisma.Sql[] = [];
  if (f.localbi_id === SIN_LOCAL) cond.push(Prisma.sql`localbi_id IS NULL`);
  else if (f.localbi_id) cond.push(Prisma.sql`localbi_id = ${f.localbi_id}`);

  if (f.canal) cond.push(Prisma.sql`canal = ${f.canal}`);
  if (f.asesor) cond.push(Prisma.sql`asesor = ${f.asesor}`);
  if (f.estado) cond.push(Prisma.sql`estado_homologado = ${f.estado}`);
  if (f.q) {
    const like = `%${f.q.trim()}%`;
    cond.push(
      Prisma.sql`(ticket_id::text ILIKE ${like} OR COALESCE(contacto, '') ILIKE ${like} OR COALESCE(dominio, '') ILIKE ${like})`,
    );
  }
  return cond.length ? Prisma.sql`WHERE ${Prisma.join(cond, " AND ")}` : Prisma.empty;
}

/** CTE base_periodo: deduplica por (canal, ticket_id) y aplica dominio/período. */
function basePeriodo(where: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    WITH base_periodo AS (
      SELECT DISTINCT ON (canal, ticket_id)
        ticket_id, fecha, hora, canal, subcanal, estado, estado_homologado,
        primera_respuesta_min_norm, resolucion_min_norm, respuesta_promedio_min_norm,
        rango_atencion, comentario_cierre, tickets_created_at, tickets_updated_at,
        contacto, numero, localbi_id, dominio, categoria, subcategoria, asesor
      FROM public.v_unificado_norm
      WHERE ${where}
      ${ORDER_DEDUPE}
    )
  `;
}

/** CTE filtrada por dimensión, sobre el mismo universo deduplicado. */
function baseFiltrado(where: Prisma.Sql, filtros: CoseFiltros): Prisma.Sql {
  return Prisma.sql`
    ${basePeriodo(where)},
    base_filtrado AS (
      SELECT * FROM base_periodo
      ${whereFiltros(filtros)}
    )
  `;
}

interface CoseRowRaw {
  ticket_id: unknown;
  fecha: Date;
  hora: string | null;
  canal: string | null;
  subcanal: string | null;
  estado: string | null;
  estado_homologado: string | null;
  primera_respuesta_min_norm: unknown;
  resolucion_min_norm: unknown;
  respuesta_promedio_min_norm: unknown;
  rango_atencion: string | null;
  comentario_cierre: string | null;
  tickets_created_at: Date | null;
  tickets_updated_at: Date | null;
  contacto: string | null;
  numero: string | null;
  localbi_id: string | null;
  dominio: string | null;
  categoria: string | null;
  subcategoria: string | null;
  asesor: string | null;
}

interface DistRaw {
  tipo: string;
  nombre: string | null;
  cantidad: number;
}

interface CoseSummaryRaw {
  total: number;
  sin_local: number;
  duplicados: number;
  n_primera: number;
  avg_primera: unknown;
  med_primera: unknown;
  n_resolucion: number;
  avg_resolucion: unknown;
  med_resolucion: unknown;
  primera_ts: string | null;
  ultima_ts: string | null;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function mapCoseRow(r: CoseRowRaw): CoseAtencion {
  return {
    ticket_id: String(r.ticket_id),
    fecha: r.fecha,
    hora: r.hora ?? "",
    canal: str(r.canal),
    subcanal: str(r.subcanal),
    estado: str(r.estado),
    estado_homologado: str(r.estado_homologado),
    primera_respuesta_min_norm: num(r.primera_respuesta_min_norm),
    resolucion_min_norm: num(r.resolucion_min_norm),
    respuesta_promedio_min_norm: num(r.respuesta_promedio_min_norm),
    rango_atencion: str(r.rango_atencion),
    comentario_cierre: str(r.comentario_cierre),
    tickets_created_at: r.tickets_created_at ?? null,
    tickets_updated_at: r.tickets_updated_at ?? null,
    contacto: str(r.contacto),
    numero: str(r.numero),
    localbi_id: str(r.localbi_id),
    dominio: str(r.dominio),
    categoria: str(r.categoria),
    subcategoria: str(r.subcategoria),
    asesor: str(r.asesor),
  };
}

function distDe(rows: DistRaw[], tipo: string): { nombre: string; cantidad: number }[] {
  return rows
    .filter((r) => r.tipo === tipo && r.nombre)
    .map((r) => ({ nombre: r.nombre as string, cantidad: Number(r.cantidad) }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es"));
}

async function queryDistribuciones(where: Prisma.Sql, filtros: CoseFiltros): Promise<DistRaw[]> {
  return prisma.$queryRaw<DistRaw[]>(Prisma.sql`
    ${baseFiltrado(where, filtros)}
    SELECT 'canal' AS tipo, canal AS nombre, COUNT(*)::int AS cantidad
    FROM base_filtrado WHERE canal IS NOT NULL GROUP BY canal
    UNION ALL
    SELECT 'estado', estado_homologado, COUNT(*)::int
    FROM base_filtrado WHERE estado_homologado IS NOT NULL GROUP BY estado_homologado
    UNION ALL
    SELECT 'categoria', categoria, COUNT(*)::int
    FROM base_filtrado WHERE categoria IS NOT NULL GROUP BY categoria
    UNION ALL
    SELECT 'subcategoria', subcategoria, COUNT(*)::int
    FROM base_filtrado WHERE subcategoria IS NOT NULL GROUP BY subcategoria
    UNION ALL
    SELECT 'asesor', asesor, COUNT(*)::int
    FROM base_filtrado WHERE asesor IS NOT NULL GROUP BY asesor
    UNION ALL
    SELECT 'local', localbi_id, COUNT(*)::int
    FROM base_filtrado WHERE localbi_id IS NOT NULL GROUP BY localbi_id
    ORDER BY tipo, cantidad DESC, nombre
  `);
}

async function queryOpciones(where: Prisma.Sql): Promise<CoseOpciones> {
  const rows = await prisma.$queryRaw<DistRaw[]>(Prisma.sql`
    ${basePeriodo(where)}
    SELECT 'canal' AS tipo, canal AS nombre, COUNT(*)::int AS cantidad
    FROM base_periodo WHERE canal IS NOT NULL GROUP BY canal
    UNION ALL
    SELECT 'estado', estado_homologado, COUNT(*)::int
    FROM base_periodo WHERE estado_homologado IS NOT NULL GROUP BY estado_homologado
    UNION ALL
    SELECT 'asesor', asesor, COUNT(*)::int
    FROM base_periodo WHERE asesor IS NOT NULL GROUP BY asesor
    UNION ALL
    SELECT 'local', localbi_id, COUNT(*)::int
    FROM base_periodo GROUP BY localbi_id
    ORDER BY tipo, cantidad DESC, nombre
  `);

  const locales = rows
    .filter((r) => r.tipo === "local")
    .map((r) => ({ localbi_id: r.nombre, cantidad: Number(r.cantidad) }))
    .sort((a, b) => {
      if (a.localbi_id === null) return -1;
      if (b.localbi_id === null) return 1;
      return b.cantidad - a.cantidad || a.localbi_id.localeCompare(b.localbi_id, "es");
    });

  return {
    canales: distDe(rows, "canal"),
    estados: distDe(rows, "estado"),
    asesores: distDe(rows, "asesor"),
    locales,
    sin_local: locales.find((l) => l.localbi_id === null)?.cantidad ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Repositorio
// ─────────────────────────────────────────────────────────────────────────────

export const actividadCopeRepository = {
  // ── Compatibilidad (sin deduplicar) ───────────────────────────────────────

  /** Total y resúmenes de actividad para una lista de dominios. */
  async resumenPorDominios(dominios: string[]): Promise<Record<string, ActividadResumen>> {
    const limpios = [...new Set(dominios.map(normalizarDominioActividad).filter(Boolean))];
    if (limpios.length === 0) return {};

    const rows = await prisma.$queryRaw<ActividadLocalRow[]>(Prisma.sql`
      SELECT localbi_id, dominio, canal, categoria, subcategoria, asesor, estado, fecha, contacto, numero
      FROM public.v_unificado_norm
      WHERE ${NORM_DOMINIO_SQL} = ANY(${limpios})
    `);

    const porDominio = new Map<string, ActividadLocalRow[]>();
    for (const r of rows) {
      const d = normalizarDominioActividad(r.dominio);
      if (!d) continue;
      if (!porDominio.has(d)) porDominio.set(d, []);
      porDominio.get(d)!.push(r);
    }

    const out: Record<string, ActividadResumen> = {};
    for (const d of limpios) out[d] = armarResumen(porDominio.get(d) ?? []);
    return out;
  },

  /** Actividad de COPE para un localbi_id (Nivel 1). Solo atenciones cuyo localbi_id coincide. */
  async actividadPorLocalbiId(localbiId: string): Promise<{ resumen: ActividadResumen; detalle: ActividadLocalRow[] }> {
    const id = localbiId.trim();
    if (!id) return { resumen: armarResumen([]), detalle: [] };
    const rows = await prisma.$queryRaw<ActividadLocalRow[]>(Prisma.sql`
      SELECT localbi_id, dominio, canal, categoria, subcategoria, asesor, estado, fecha, contacto, numero
      FROM public.v_unificado_norm
      WHERE localbi_id = ${id}
      ORDER BY fecha DESC
      LIMIT 30
    `);
    return { resumen: armarResumen(rows), detalle: rows };
  },

  /** Resumen de actividad por localbi_id (Nivel 1) para una lista de locales. */
  async resumenPorLocalbiIds(localbiIds: string[]): Promise<Record<string, { total: number; ultima_atencion: string | null }>> {
    const limpios = [...new Set(localbiIds.map((s) => s.trim()).filter(Boolean))];
    if (limpios.length === 0) return {};
    const rows = await prisma.$queryRaw<{ localbi_id: string; fecha: Date }[]>(Prisma.sql`
      SELECT localbi_id, fecha
      FROM public.v_unificado_norm
      WHERE localbi_id = ANY(${limpios})
    `);
    const out: Record<string, { total: number; ultima_atencion: string | null }> = {};
    for (const id of limpios) out[id] = { total: 0, ultima_atencion: null };
    for (const r of rows) {
      const id = r.localbi_id?.trim();
      if (!id || !out[id]) continue;
      out[id].total += 1;
      if (!out[id].ultima_atencion || r.fecha > new Date(out[id].ultima_atencion)) {
        out[id].ultima_atencion = r.fecha.toISOString();
      }
    }
    return out;
  },

  /** Detalle de atenciones (últimas N) para una lista de dominios. */
  async detallePorDominios(dominios: string[], limite = 30): Promise<Record<string, ActividadLocalRow[]>> {
    const limpios = [...new Set(dominios.map(normalizarDominioActividad).filter(Boolean))];
    if (limpios.length === 0) return {};

    const rows = await prisma.$queryRaw<ActividadLocalRow[]>(Prisma.sql`
      SELECT localbi_id, dominio, canal, categoria, subcategoria, asesor, estado, fecha, contacto, numero
      FROM public.v_unificado_norm
      WHERE ${NORM_DOMINIO_SQL} = ANY(${limpios})
      ORDER BY fecha DESC
      LIMIT ${limite}
    `);

    const out: Record<string, ActividadLocalRow[]> = {};
    for (const r of rows) {
      const d = normalizarDominioActividad(r.dominio);
      if (!d) continue;
      if (!out[d]) out[d] = [];
      out[d].push(r);
    }
    return out;
  },

  // ── COSE (deduplicado, período, filtros, agregados SQL) ───────────────────

  async actividadCoseAgregada(dominios: string[], filtros: CoseFiltros = {}): Promise<CoseAgregada> {
    const where = whereCose(dominios, { desde: filtros.desde, hasta: filtros.hasta });
    const base = baseFiltrado(where, filtros);
    const limite = Math.min(Math.max(filtros.limite ?? 200, 1), 500);
    // Chips: se aplica todo menos la dimensión del propio chip.
    const filtrosSinEstado: CoseFiltros = { ...filtros, estado: undefined };
    const filtrosSinLocal: CoseFiltros = { ...filtros, localbi_id: undefined };

    const [summaryRows, distRows, opciones, detalleRaw, chipEstadosRows, chipSinLocalRows] = await Promise.all([
      prisma.$queryRaw<CoseSummaryRaw[]>(Prisma.sql`
        ${base}
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE localbi_id IS NULL)::int AS sin_local,
          ((SELECT COUNT(*) FROM public.v_unificado_norm WHERE ${where}) - (SELECT COUNT(*) FROM base_periodo))::int AS duplicados,
          COUNT(primera_respuesta_min_norm)::int AS n_primera,
          AVG(primera_respuesta_min_norm) AS avg_primera,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm) AS med_primera,
          COUNT(resolucion_min_norm)::int AS n_resolucion,
          AVG(resolucion_min_norm) AS avg_resolucion,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm) AS med_resolucion,
          to_char(MIN(fecha + NULLIF(hora, '')::time), 'YYYY-MM-DD"T"HH24:MI:SS') AS primera_ts,
          to_char(MAX(fecha + NULLIF(hora, '')::time), 'YYYY-MM-DD"T"HH24:MI:SS') AS ultima_ts
        FROM base_filtrado
      `),
      queryDistribuciones(where, filtros),
      queryOpciones(where),
      prisma.$queryRaw<CoseRowRaw[]>(Prisma.sql`
        ${base}
        SELECT * FROM base_filtrado
        ORDER BY fecha DESC, NULLIF(hora, '')::time DESC, ticket_id DESC
        LIMIT ${limite}
      `),
      prisma.$queryRaw<{ nombre: string; cantidad: number }[]>(Prisma.sql`
        ${baseFiltrado(where, filtrosSinEstado)}
        SELECT estado_homologado AS nombre, COUNT(*)::int AS cantidad
        FROM base_filtrado
        WHERE estado_homologado IS NOT NULL
        GROUP BY estado_homologado
        ORDER BY cantidad DESC, nombre
      `),
      prisma.$queryRaw<{ cantidad: number }[]>(Prisma.sql`
        ${baseFiltrado(where, filtrosSinLocal)}
        SELECT COUNT(*)::int AS cantidad
        FROM base_filtrado
        WHERE localbi_id IS NULL
      `),
    ]);

    const s = summaryRows[0] ?? {
      total: 0,
      sin_local: 0,
      duplicados: 0,
      n_primera: 0,
      avg_primera: null,
      med_primera: null,
      n_resolucion: 0,
      avg_resolucion: null,
      med_resolucion: null,
      primera_ts: null,
      ultima_ts: null,
    };
    const total = Number(s.total);
    const nPrimera = Number(s.n_primera);
    const nResolucion = Number(s.n_resolucion);

    const resumen: CoseResumen = {
      total,
      sin_local: Number(s.sin_local),
      duplicados: Number(s.duplicados),
      canales: distDe(distRows, "canal"),
      categorias: distDe(distRows, "categoria"),
      subcategorias: distDe(distRows, "subcategoria"),
      asesores: distDe(distRows, "asesor"),
      estados: distDe(distRows, "estado"),
      locales: distDe(distRows, "local").map((x) => ({ localbi_id: x.nombre, cantidad: x.cantidad })),
      primera_respuesta: {
        n: nPrimera,
        promedio: num(s.avg_primera),
        mediana: num(s.med_primera),
        cobertura: total > 0 ? nPrimera / total : 0,
      },
      resolucion: {
        n: nResolucion,
        promedio: num(s.avg_resolucion),
        mediana: num(s.med_resolucion),
        cobertura: total > 0 ? nResolucion / total : 0,
      },
      primera_atencion: s.primera_ts ?? null,
      ultima_atencion: s.ultima_ts ?? null,
    };

    return {
      resumen,
      ultimasAtenciones: detalleRaw.map(mapCoseRow),
      opciones,
      chips: {
        estados: (chipEstadosRows ?? []).map((r) => ({
          nombre: String(r.nombre),
          cantidad: Number(r.cantidad),
        })),
        sin_local: Number(chipSinLocalRows?.[0]?.cantidad ?? 0),
      },
    };
  },
};
