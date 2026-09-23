/**
 * DominioDiscoveryRepository — descubre dominios en v_unificado_norm
 * por coincidencia parcial (ILIKE) contra dominio.
 *
 * Solo LEE v_unificado_norm. NO crea tablas, NO modifica datos.
 * Se usa como mecanismo de apoyo para enriquecer la búsqueda de clientes
 * en el módulo /clientes (COPE).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizeDomain } from "../domain/contacto/normalizacion";

export interface DominioCandidato {
  dominio: string;
}

const MAX_CANDIDATOS = 20;

/**
 * Busca dominios en v_unificado_norm que coincidan parcialmente con el
 * término de búsqueda. Busca en la columna dominio.
 *
 * Deduplica por dominio normalizado y limita a MAX_CANDIDATOS.
 */
export async function buscarDominiosCandidatos(busqueda: string): Promise<DominioCandidato[]> {
  const token = busqueda.trim();
  if (!token) return [];

  const likePattern = `%${token}%`;

  const rows = await prisma.$queryRaw<{ dominio: string }[]>(Prisma.sql`
    SELECT DISTINCT NULLIF(TRIM(dominio), '') AS dominio
    FROM public.v_unificado_norm
    WHERE dominio ILIKE ${likePattern}
    LIMIT ${MAX_CANDIDATOS}
  `);

  const vistos = new Set<string>();
  const resultado: DominioCandidato[] = [];
  for (const r of rows) {
    const d = normalizeDomain(r.dominio);
    if (!d || vistos.has(d)) continue;
    vistos.add(d);
    resultado.push({ dominio: d });
  }
  return resultado;
}
