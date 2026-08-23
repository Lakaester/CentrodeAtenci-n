/**
 * ContactoDominioRepository — relación persistente CONTACTO ↔ DOMINIOS.
 * Identidad: tipo (email|whatsapp) + valor_normalizado.
 * Un contacto puede tener MÚLTIPLES dominios (no es 1:1).
 *
 * La normalización usa la capa de dominio central (domain/contacto/normalizacion):
 *  - normalizeDomain: hostname canónico (sin http/https/path/query/fragment/slash).
 *  - normalizeContactIdentifier: email lowercase / whatsapp dígitos.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { genId } from "./facturacion.types";
import {
  normalizeDomain,
  isValidDomainFormat,
  normalizeContactIdentifier,
  type ContactoTipo,
} from "../domain/contacto/normalizacion";

export type { ContactoTipo };

export type ContactoDominioOrigen =
  | "MANUAL"
  | "ZENDESK_EXPLICITO"
  | "HISTORIAL"
  | "WHATSAPP_HISTORICO"
  | "AUTO"
  | "CONFLICTO";

export interface ContactoDominioRow {
  id: string;
  contacto_identidad_id: string;
  dominio: string;
  usuario_vinculacion: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  origen: string | null;
  ultima_utilizacion: Date | null;
  contador_uso: number;
}

export interface DominioVinculado {
  dominio: string;
  origen: string | null;
  ultima_utilizacion: Date | null;
  contador_uso: number;
}

export const contactoDominioRepository = {
  /**
   * Dominios activos (con metadatos de uso) de un contacto.
   * Crea la identidad si no existe (solo retorna dominios; no crea dominio por defecto).
   */
  async obtenerDominios(tipo: ContactoTipo, valor: string): Promise<DominioVinculado[]> {
    const v = normalizeContactIdentifier(tipo, valor);
    if (!v) return [];
    const rows = await prisma.$queryRaw<ContactoDominioRow[]>(Prisma.sql`
      SELECT cd.* FROM contacto_dominio cd
      JOIN contacto_identidad ci ON ci.id = cd.contacto_identidad_id
      WHERE ci.tipo = ${tipo} AND ci.valor_normalizado = ${v} AND ci.activo = TRUE AND cd.activo = TRUE
      ORDER BY cd.ultima_utilizacion DESC NULLS LAST, cd.created_at ASC
    `);
    return rows.map((r) => ({
      dominio: r.dominio,
      origen: r.origen,
      ultima_utilizacion: r.ultima_utilizacion,
      contador_uso: r.contador_uso,
    }));
  },

  /**
   * Obtiene el id de la identidad, creándola si no existe.
   */
  async obtenerOCrearIdentidad(tipo: ContactoTipo, valor: string): Promise<string> {
    const v = normalizeContactIdentifier(tipo, valor);
    const identidad = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      INSERT INTO contacto_identidad (id, tipo, valor_normalizado)
      VALUES (${genId()}, ${tipo}, ${v})
      ON CONFLICT (tipo, valor_normalizado) DO UPDATE SET updated_at = now()
      RETURNING id
    `);
    return identidad[0].id;
  },

  /**
   * Vincula (o reactiva) un dominio a un contacto. Idempotente.
   * Registra el origen, el usuario y marca la primera utilización.
   */
  async vincularDominio(
    tipo: ContactoTipo,
    valor: string,
    dominio: string,
    usuario: string | null,
    origen: ContactoDominioOrigen = "MANUAL",
  ): Promise<{ ok: boolean; dominio: string } | null> {
    const v = normalizeContactIdentifier(tipo, valor);
    const d = normalizeDomain(dominio);
    if (!v || !d || !isValidDomainFormat(d)) return null;

    const identidadId = await this.obtenerOCrearIdentidad(tipo, valor);

    await prisma.$queryRaw<ContactoDominioRow[]>(Prisma.sql`
      INSERT INTO contacto_dominio (id, contacto_identidad_id, dominio, usuario_vinculacion, activo, origen, ultima_utilizacion)
      VALUES (${genId()}, ${identidadId}, ${d}, ${usuario ?? null}, TRUE, ${origen}, now())
      ON CONFLICT (contacto_identidad_id, dominio)
      DO UPDATE SET
        activo = TRUE,
        usuario_vinculacion = ${usuario ?? null},
        origen = ${origen},
        ultima_utilizacion = now(),
        updated_at = now()
    `);
    return { ok: true, dominio: d };
  },

  /**
   * Registra una utilización de un dominio (última fecha + contador).
   * Se invoca cuando la identificación resuelve hacia un dominio.
   */
  async registrarUso(tipo: ContactoTipo, valor: string, dominio: string): Promise<void> {
    const v = normalizeContactIdentifier(tipo, valor);
    const d = normalizeDomain(dominio);
    if (!v || !d) return;
    await prisma.$executeRaw`
      UPDATE contacto_dominio cd
      SET ultima_utilizacion = now(), contador_uso = contador_uso + 1, updated_at = now()
      FROM contacto_identidad ci
      WHERE cd.contacto_identidad_id = ci.id
        AND ci.tipo = ${tipo} AND ci.valor_normalizado = ${v}
        AND cd.dominio = ${d} AND cd.activo = TRUE
    `;
  },

  /** Desactiva un dominio de un contacto (no borra). */
  async desvincularDominio(tipo: ContactoTipo, valor: string, dominio: string): Promise<void> {
    const v = normalizeContactIdentifier(tipo, valor);
    const d = normalizeDomain(dominio);
    if (!v || !d) return;
    await prisma.$executeRaw`
      UPDATE contacto_dominio cd
      SET activo = FALSE, updated_at = now()
      FROM contacto_identidad ci
      WHERE cd.contacto_identidad_id = ci.id
        AND ci.tipo = ${tipo} AND ci.valor_normalizado = ${v}
        AND cd.dominio = ${d}
    `;
  },

  /**
   * Lista identidades para la migración desde fuentes externas (JSON).
   */
  async listarIdentidades(): Promise<{ tipo: ContactoTipo; valor_normalizado: string; activo: boolean }[]> {
    return prisma.$queryRaw`
      SELECT tipo, valor_normalizado, activo FROM contacto_identidad ORDER BY tipo, valor_normalizado
    `;
  },
};
