/**
 * SoporteOnlineRepository — consulta public.incidencias (Soporte en Línea)
 * para enriquecer la Historia Clínica de COPE.
 *
 * Vínculo oficial: incidencias.suscripcion (dominio) → localbi.link_dominio.
 * No inventa otras relaciones. No crea tablas.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface IncidenciaRow {
  id_incidencia: string;
  ticket_timestamp: Date;
  descripcion: string | null;
  suscripcion: string | null;
  local_nombre: string | null;
  categorizacion: string | null;
  estado: string | null;
  solucion: string | null;
  asesor_nombre: string | null;
  tiempo_espera_minutos: number | null;
  tiempo_solucion_minutos: number | null;
  incidenciacliente_localpais: string | null;
  tipoproblema: string | null;
  subtipoproblema: string | null;
  incidenciacliente_kam: string | null;
}

export interface SoporteResumen {
  total: number;
  abiertas: number;
  cerradas: number;
  primera_incidencia: string | null;
  ultima_incidencia: string | null;
  prom_espera_min: number | null;
  prom_solucion_min: number | null;
  categorias: { nombre: string; cantidad: number }[];
  estados: { nombre: string; cantidad: number }[];
  porLocal: { local: string; cantidad: number }[];
}

/** Normaliza un dominio (lowercase, trim, sin protocolo, sin trailing slash). */
export function normalizarDominio(d: string | null | undefined): string {
  if (!d) return "";
  return d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
}

const NORM_SUSCRIPCION = Prisma.sql`NULLIF(TRIM(LOWER(REPLACE(REPLACE(REPLACE(suscripcion,'https://',''),'http://',''),'/',''))), '')`;

/** Período en días (7/30/90/todo). null = todo. */
function periodoDias(periodo?: string): number | null {
  const p = Number(periodo);
  if ([7, 30, 90].includes(p)) return p;
  return null;
}

function agrupar<T>(filas: T[], k: (r: T) => string | null | undefined): { nombre: string; cantidad: number }[] {
  const m = new Map<string, number>();
  for (const f of filas) {
    const v = k(f)?.trim();
    if (!v) continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

export const soporteOnlineRepository = {
  /**
   * Resumen por dominio para una lista de dominios y un período.
   * Devuelve { dominio → SoporteResumen } además de las últimas incidencias.
   */
  async resumenPorDominios(dominios: string[], periodo?: string): Promise<{
    resumenes: Record<string, SoporteResumen>;
    ultimas: Record<string, IncidenciaRow[]>;
  }> {
    const limpios = [...new Set(dominios.map(normalizarDominio).filter(Boolean))];
    if (limpios.length === 0) return { resumenes: {}, ultimas: {} };

    const dias = periodoDias(periodo);
    const filas = await prisma.$queryRaw<IncidenciaRow[]>(Prisma.sql`
      SELECT id_incidencia, ticket_timestamp, descripcion, suscripcion, local_nombre,
             categorizacion, estado, solucion, asesor_nombre,
             tiempo_espera_minutos, tiempo_solucion_minutos,
             incidenciacliente_localpais, tipoproblema, subtipoproblema, incidenciacliente_kam
      FROM public.incidencias
      WHERE ${NORM_SUSCRIPCION} = ANY(${limpios})
        ${dias ? Prisma.sql`AND ticket_timestamp >= now() - make_interval(days => ${dias}::int)` : Prisma.empty}
    `);

    const porDominio = new Map<string, IncidenciaRow[]>();
    for (const r of filas) {
      const d = normalizarDominio(r.suscripcion);
      if (!d) continue;
      if (!porDominio.has(d)) porDominio.set(d, []);
      porDominio.get(d)!.push(r);
    }

    const resumenes: Record<string, SoporteResumen> = {};
    const ultimas: Record<string, IncidenciaRow[]> = {};
    for (const d of limpios) {
      const filasD = porDominio.get(d) ?? [];
      const fechas = filasD.map((f) => f.ticket_timestamp).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
      const cerradas = filasD.filter((f) => String(f.estado).toLowerCase() === "terminada").length;
      const conEspera = filasD.filter((f) => f.tiempo_espera_minutos != null);
      const conSolucion = filasD.filter((f) => f.tiempo_solucion_minutos != null);
      resumenes[d] = {
        total: filasD.length,
        abiertas: filasD.length - cerradas,
        cerradas,
        primera_incidencia: fechas.length ? fechas[0].toISOString() : null,
        ultima_incidencia: fechas.length ? fechas[fechas.length - 1].toISOString() : null,
        prom_espera_min: conEspera.length ? Math.round(conEspera.reduce((a, f) => a + (f.tiempo_espera_minutos ?? 0), 0) / conEspera.length) : null,
        prom_solucion_min: conSolucion.length ? Math.round(conSolucion.reduce((a, f) => a + (f.tiempo_solucion_minutos ?? 0), 0) / conSolucion.length) : null,
        categorias: agrupar(filasD, (f) => f.tipoproblema),
        estados: agrupar(filasD, (f) => f.estado),
        porLocal: agrupar(filasD, (f) => f.local_nombre),
      };
      // últimas incidencias ordenadas por fecha desc
      ultimas[d] = [...filasD].sort((a, b) => b.ticket_timestamp.getTime() - a.ticket_timestamp.getTime()).slice(0, 20);
    }

    return { resumenes, ultimas };
  },

  /**
   * Mapa dominio → local_nombre representativo (para fallback de nombre de local).
   * Solo devuelve cuando el dominio es inequívoco (1 solo local distinto).
   */
  async nombreLocalPorDominio(dominios: string[]): Promise<Record<string, string>> {
    const limpios = [...new Set(dominios.map(normalizarDominio).filter(Boolean))];
    if (limpios.length === 0) return {};
    const rows = await prisma.$queryRaw<{ suscripcion: string; local_nombre: string }[]>(Prisma.sql`
      SELECT ${NORM_SUSCRIPCION} AS suscripcion, MAX(local_nombre) AS local_nombre
      FROM public.incidencias
      WHERE ${NORM_SUSCRIPCION} = ANY(${limpios})
      GROUP BY ${NORM_SUSCRIPCION}
      HAVING COUNT(DISTINCT COALESCE(NULLIF(TRIM(local_nombre), ''), '')) = 1
    `);
    const out: Record<string, string> = {};
    for (const r of rows) {
      const d = normalizarDominio(r.suscripcion);
      const nombre = r.local_nombre?.trim();
      if (d && nombre) out[d] = nombre;
    }
    return out;
  },
};
