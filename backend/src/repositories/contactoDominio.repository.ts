/**
 * ContactoDominioRepository — relación persistente CONTACTO ↔ DOMINIOS.
 * Identidad: tipo (email|whatsapp) + valor_normalizado.
 * Un contacto puede tener MÚLTIPLES dominios (no es 1:1).
 * Normalización: email → lowercase trim; whatsapp → dígitos.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { genId } from "./facturacion.types";

export type ContactoTipo = "email" | "whatsapp";

export interface ContactoDominioRow {
  id: string;
  contacto_identidad_id: string;
  dominio: string;
  usuario_vinculacion: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Normaliza el valor de identidad según el tipo. */
export function normalizarIdentidad(tipo: ContactoTipo, valor: string): string {
  const v = valor?.trim() ?? "";
  if (tipo === "email") return v.toLowerCase();
  // whatsapp: solo dígitos, sin +, espacios, guiones
  return v.replace(/[^\d]/g, "");
}

/** Normaliza un dominio (lowercase, trim, sin protocolo, sin trailing slash). */
export function normalizarDominioContacto(d: string): string {
  return d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
}

export const contactoDominioRepository = {
  /**
   * Dominios activos de un contacto. Crea la identidad si no existe (solo
   * retorna los dominios; no crea dominio por defecto).
   */
  async obtenerDominios(tipo: ContactoTipo, valor: string): Promise<string[]> {
    const v = normalizarIdentidad(tipo, valor);
    if (!v) return [];
    const rows = await prisma.$queryRaw<ContactoDominioRow[]>(Prisma.sql`
      SELECT cd.* FROM contacto_dominio cd
      JOIN contacto_identidad ci ON ci.id = cd.contacto_identidad_id
      WHERE ci.tipo = ${tipo} AND ci.valor_normalizado = ${v} AND ci.activo = TRUE AND cd.activo = TRUE
      ORDER BY cd.created_at ASC
    `);
    return rows.map((r) => r.dominio);
  },

  /** Vincula (o reactiva) un dominio a un contacto. Idempotente. */
  async vincularDominio(tipo: ContactoTipo, valor: string, dominio: string, usuario: string | null): Promise<void> {
    const v = normalizarIdentidad(tipo, valor);
    const d = normalizarDominioContacto(dominio);
    if (!v || !d) return;

    // Obtener o crear la identidad.
    const identidad = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      INSERT INTO contacto_identidad (id, tipo, valor_normalizado)
      VALUES (${genId()}, ${tipo}, ${v})
      ON CONFLICT (tipo, valor_normalizado) DO UPDATE SET updated_at = now()
      RETURNING id
    `);
    const identidadId = identidad[0].id;

    // Vincular el dominio (upsert: reactivar si estaba desactivado).
    await prisma.$queryRaw<ContactoDominioRow[]>(Prisma.sql`
      INSERT INTO contacto_dominio (id, contacto_identidad_id, dominio, usuario_vinculacion, activo)
      VALUES (${genId()}, ${identidadId}, ${d}, ${usuario ?? null}, TRUE)
      ON CONFLICT (contacto_identidad_id, dominio)
      DO UPDATE SET activo = TRUE, usuario_vinculacion = ${usuario ?? null}, updated_at = now()
    `);
  },

  /** Desactiva un dominio de un contacto (no borra). */
  async desvincularDominio(tipo: ContactoTipo, valor: string, dominio: string): Promise<void> {
    const v = normalizarIdentidad(tipo, valor);
    const d = normalizarDominioContacto(dominio);
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
};
