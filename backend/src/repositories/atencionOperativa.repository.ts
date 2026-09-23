/**
 * AtencionOperativaRepository — persistencia del registro operativo de cada atención.
 *
 * La atención es una entidad conceptual independiente de Zendesk:
 *   - zendesk_ticket_id es SOLO una referencia externa.
 *   - El snapshot operativo (identificación, clasificación, calificación, asesor,
 *     estado, auditoría) se persiste en COPE.
 *
 * Regla de precedencia:
 *   - Un campo registrado manualmente en COPE (origen='cope') NO se sobrescribe
 *     al sincronizar Zendesk (origen='zendesk').
 *   - La sincronización completa campos que aún no tienen valor en COPE.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizeDomain } from "../domain/contacto/normalizacion";
import { genId } from "./facturacion.types";

export type AtencionOrigen = "cope" | "zendesk";

export type TipoIdentificacion =
  | "AUTO"
  | "MANUAL"
  | "ZENDESK_EXPLICITO"
  | "HISTORIAL"
  | "SIN_IDENTIFICAR";

export interface AtencionSnapshot {
  id: string;
  zendesk_ticket_id: string | null;
  contacto_tipo: string | null;
  contacto_valor: string | null;
  dominio_identificado: string | null;
  tipo_identificacion: string | null;
  identificado_por: string | null;
  identificado_at: Date | null;
  categoria: string | null;
  subcategoria: string | null;
  categorizado_por: string | null;
  categorizado_at: Date | null;
  calificacion: string | null;
  calificado_por: string | null;
  calificado_at: Date | null;
  asesor: string | null;
  asignado_at: Date | null;
  estado: string | null;
  resuelto_at: Date | null;
  cerrado_at: Date | null;
  dominio_origen: string | null;
  categoria_origen: string | null;
  calificacion_origen: string | null;
  zendesk_snapshot: unknown | null;
  created_at: Date;
  updated_at: Date;
}

export interface AtencionAuditoriaRow {
  id: string;
  atencion_id: string;
  accion: string;
  usuario: string | null;
  detalle: string | null;
  campo: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  origen: string;
  created_at: Date;
}

/** Datos mínimos que llegan desde Zendesk (snapshot original, no se sobreescribe). */
export interface DatosZendeskSnapshot {
  asunto?: string | null;
  descripcion?: string | null;
  clienteEmail?: string | null;
  telefono?: string | null;
  dominio?: string | null;
  pais?: string | null;
  estado?: string | null;
  prioridad?: string | null;
  tipo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  tags?: string[];
  assigneeId?: number | null;
  requesterId?: number | null;
}

function rowToSnapshot(row: any): AtencionSnapshot {
  return {
    id: row.id,
    zendesk_ticket_id: row.zendesk_ticket_id ?? null,
    contacto_tipo: row.contacto_tipo ?? null,
    contacto_valor: row.contacto_valor ?? null,
    dominio_identificado: row.dominio_identificado ?? null,
    tipo_identificacion: row.tipo_identificacion ?? null,
    identificado_por: row.identificado_por ?? null,
    identificado_at: row.identificado_at ?? null,
    categoria: row.categoria ?? null,
    subcategoria: row.subcategoria ?? null,
    categorizado_por: row.categorizado_por ?? null,
    categorizado_at: row.categorizado_at ?? null,
    calificacion: row.calificacion ?? null,
    calificado_por: row.calificado_por ?? null,
    calificado_at: row.calificado_at ?? null,
    asesor: row.asesor ?? null,
    asignado_at: row.asignado_at ?? null,
    estado: row.estado ?? null,
    resuelto_at: row.resuelto_at ?? null,
    cerrado_at: row.cerrado_at ?? null,
    dominio_origen: row.dominio_origen ?? null,
    categoria_origen: row.categoria_origen ?? null,
    calificacion_origen: row.calificacion_origen ?? null,
    zendesk_snapshot: row.zendesk_snapshot ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const atencionOperativaRepository = {
  /**
   * Obtiene el snapshot operativo por ticket Zendesk. Si no existe, crea uno
   * vacío (con la referencia externa) y registra que proviene de Zendesk.
   */
  async obtenerOCrearPorTicket(
    zendeskTicketId: string,
    datosZendesk?: DatosZendeskSnapshot,
  ): Promise<AtencionSnapshot> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM atencion WHERE zendesk_ticket_id = ${zendeskTicketId} LIMIT 1
    `);
    if (rows.length > 0) return rowToSnapshot(rows[0]);

    const id = genId();
    const snapshot = datosZendesk ? JSON.stringify(datosZendesk) : null;
    const estado = datosZendesk?.estado ?? null;
    const contactoValor = datosZendesk?.clienteEmail ?? null;
    const contactoValorFinal = contactoValor ? contactoValor.toLowerCase().trim() : null;

    await prisma.$executeRaw`
      INSERT INTO atencion (
        id, zendesk_ticket_id, contacto_tipo, contacto_valor, estado,
        zendesk_snapshot, created_at, updated_at
      ) VALUES (
        ${id}, ${zendeskTicketId}, ${contactoValorFinal ? "email" : null},
        ${contactoValorFinal}, ${estado}, ${snapshot}::jsonb, now(), now()
      )
      ON CONFLICT (zendesk_ticket_id) DO UPDATE SET updated_at = now()
    `;

    const nuevo = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM atencion WHERE id = ${id} LIMIT 1
    `);
    return rowToSnapshot(nuevo[0]);
  },

  /** Registra una acción de auditoría. */
  async registrarAuditoria(entrada: {
    atencionId: string;
    accion: string;
    usuario?: string | null;
    detalle?: string | null;
    campo?: string | null;
    valorAnterior?: string | null;
    valorNuevo?: string | null;
    origen: AtencionOrigen;
  }): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO atencion_auditoria (
        id, atencion_id, accion, usuario, detalle, campo, valor_anterior, valor_nuevo, origen
      ) VALUES (
        ${genId()}, ${entrada.atencionId}, ${entrada.accion},
        ${entrada.usuario ?? null}, ${entrada.detalle ?? null},
        ${entrada.campo ?? null}, ${entrada.valorAnterior ?? null},
        ${entrada.valorNuevo ?? null}, ${entrada.origen}
      )
    `;
  },

  /** Lista la auditoría de una atención (más reciente primero). */
  async listarAuditoria(atencionId: string): Promise<AtencionAuditoriaRow[]> {
    return prisma.$queryRaw<AtencionAuditoriaRow[]>(Prisma.sql`
      SELECT * FROM atencion_auditoria
      WHERE atencion_id = ${atencionId}
      ORDER BY created_at DESC
    `);
  },

  /**
   * Actualiza la identificación (dominio) del snapshot.
   * Solo si: no hay identificación previa registrada manualmente en COPE,
   * o la nueva también viene de COPE (edición manual).
   */
  async actualizarIdentificacion(
    atencionId: string,
    entrada: {
      contactoTipo?: string | null;
      contactoValor?: string | null;
      dominio?: string | null;
      tipoIdentificacion?: TipoIdentificacion;
      usuario?: string | null;
      origen: AtencionOrigen;
    },
  ): Promise<void> {
    const actual = await this.obtenerPorId(atencionId);
    if (!actual) return;

    // Si ya hay identificación manual en COPE y el nuevo dato viene de Zendesk,
    // NO sobrescribir (regla de precedencia).
    if (
      actual.dominio_identificado &&
      actual.dominio_origen === "cope" &&
      entrada.origen === "zendesk"
    ) {
      return;
    }

    await prisma.$executeRaw`
      UPDATE atencion SET
        contacto_tipo = COALESCE(${entrada.contactoTipo ?? null}, contacto_tipo),
        contacto_valor = COALESCE(${entrada.contactoValor ?? null}, contacto_valor),
        dominio_identificado = COALESCE(${normalizeDomain(entrada.dominio) || null}, dominio_identificado),
        tipo_identificacion = COALESCE(${entrada.tipoIdentificacion ?? null}, tipo_identificacion),
        identificado_por = ${entrada.usuario ?? null},
        identificado_at = now(),
        dominio_origen = ${entrada.origen},
        updated_at = now()
      WHERE id = ${atencionId}
    `;
  },

  /**
   * Actualiza la clasificación (categoría/subcategoría) del snapshot.
   * Igual precedencia: una categoría manual en COPE no se pisa por Zendesk.
   */
  async actualizarClasificacion(
    atencionId: string,
    entrada: {
      categoria?: string | null;
      subcategoria?: string | null;
      usuario?: string | null;
      origen: AtencionOrigen;
    },
  ): Promise<void> {
    const actual = await this.obtenerPorId(atencionId);
    if (!actual) return;

    if (
      actual.categoria &&
      actual.categoria_origen === "cope" &&
      entrada.origen === "zendesk"
    ) {
      return;
    }

    await prisma.$executeRaw`
      UPDATE atencion SET
        categoria = COALESCE(${entrada.categoria ?? null}, categoria),
        subcategoria = COALESCE(${entrada.subcategoria ?? null}, subcategoria),
        categorizado_por = ${entrada.usuario ?? null},
        categorizado_at = now(),
        categoria_origen = ${entrada.origen},
        updated_at = now()
      WHERE id = ${atencionId}
    `;
  },

  /** Actualiza la calificación del snapshot (solo COPE — no viene de Zendesk). */
  async actualizarCalificacion(
    atencionId: string,
    entrada: {
      calificacion?: string | null;
      usuario?: string | null;
    },
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE atencion SET
        calificacion = ${entrada.calificacion ?? null},
        calificado_por = ${entrada.usuario ?? null},
        calificado_at = now(),
        calificacion_origen = 'cope',
        updated_at = now()
      WHERE id = ${atencionId}
    `;
  },

  /** Actualiza el estado del snapshot (desde Zendesk o COPE). */
  async actualizarEstado(
    atencionId: string,
    entrada: {
      estado?: string | null;
      asesor?: string | null;
      origen: AtencionOrigen;
    },
  ): Promise<void> {
    const ahora = new Date();
    await prisma.$executeRaw`
      UPDATE atencion SET
        estado = ${entrada.estado ?? null},
        asesor = ${entrada.asesor ?? null},
        asignado_at = CASE WHEN ${entrada.asesor ?? null} IS NOT NULL THEN COALESCE(asignado_at, ${ahora.toISOString()}::timestamptz) ELSE asignado_at END,
        resuelto_at = CASE WHEN ${entrada.estado} = 'solved' AND resuelto_at IS NULL THEN now() ELSE resuelto_at END,
        cerrado_at = CASE WHEN ${entrada.estado} = 'closed' AND cerrado_at IS NULL THEN now() ELSE cerrado_at END,
        updated_at = now()
      WHERE id = ${atencionId}
    `;
  },

  async obtenerPorId(id: string): Promise<AtencionSnapshot | null> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM atencion WHERE id = ${id} LIMIT 1
    `);
    return rows.length > 0 ? rowToSnapshot(rows[0]) : null;
  },
};