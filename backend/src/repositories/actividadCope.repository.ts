/**
 * ActividadCopeRepository — consulta la actividad real de atenciones en COPE
 * desde public.v_unificado_norm (fuente unificada de atenciones de todos los canales).
 *
 * No duplica la vista ni crea tablas. Solo lee v_unificado_norm, igual que el
 * resto del proyecto (dashboard, reportería).
 *
 * Regla de match (prioridad):
 *   1) dominio        (v_unificado_norm.dominio)
 *   2) localbi_id     (v_unificado_norm.localbi_id)
 *   → RUC / unidad de negocio no existen en la vista → se omiten.
 *   → nombre (v_unificado_norm.cliente) solo como último recurso inequívoco.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

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

/** Normaliza un dominio para comparación (lowercase, trim, sin protocolo, sin trailing slash). */
export function normalizarDominioActividad(d: string | null | undefined): string {
  if (!d) return "";
  return d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
}

/** Expresión SQL que normaliza el dominio igual que JS (para match por dominio). */
const NORM_DOMINIO_SQL = Prisma.sql`NULLIF(TRIM(LOWER(REPLACE(REPLACE(REPLACE(dominio,'https://',''),'http://',''),'/',''))), '')`;

/** Construye el resumen agregado desde las filas de un dominio. */
function armarResumen(filas: ActividadLocalRow[]): ActividadResumen {
  const agrupar = (k: (r: ActividadLocalRow) => string | null) => {
    const m = new Map<string, number>();
    for (const f of filas) {
      const v = k(f)?.trim();
      if (!v) continue;
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
  };
  const fechas = filas.map((f) => f.fecha).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
  return {
    total: filas.length,
    canales: agrupar((r) => r.canal),
    categorias: agrupar((r) => r.categoria),
    subcategorias: agrupar((r) => r.subcategoria),
    asesores: agrupar((r) => r.asesor),
    estados: agrupar((r) => r.estado),
    primera_atencion: fechas.length ? fechas[0].toISOString() : null,
    ultima_atencion: fechas.length ? fechas[fechas.length - 1].toISOString() : null,
  };
}

export const actividadCopeRepository = {
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
};
