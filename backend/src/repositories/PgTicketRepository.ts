import { prisma } from "./prisma";
import { Ticket, type TicketData } from "../domain/tickets/Ticket";
import type { ITicketRepository, TicketFilters } from "../contracts/tickets/ITicketRepository";
import type { TicketStatus } from "../domain/tickets/TicketStatus";
import type { ExternalChannel } from "../domain/tickets/TicketChannel";

function translateState(estadoHomologado: string | null): TicketStatus {
  const e = (estadoHomologado ?? "").toLowerCase().trim();
  if (e === "cerrado" || e === "resuelto") return "CERRADO";
  if (e === "en_proceso" || e === "sin_atender" || e === "pendiente") return "EN_PROCESO";
  return "PENDIENTE";
}

function translateChannel(canal: string | null): ExternalChannel {
  const c = (canal ?? "").toLowerCase();
  if (c.includes("what") || c.includes("wpp")) return "whaticket";
  if (c.includes("meta") || c.includes("messenger")) return "meta";
  if (c.includes("zendesk") || c.includes("correo")) return "zendesk";
  return "correo";
}

function calculateSla(primeraRespuestaMin: number | null, resolucionMin: number | null): { slaPorcentaje: number; slaVencido: boolean } {
  const max = Math.max(primeraRespuestaMin ?? 0, resolucionMin ?? 0);
  const umbral = 120;
  if (max === 0) return { slaPorcentaje: 0, slaVencido: false };
  const pct = Math.min(100, Math.round((max / umbral) * 100));
  return { slaPorcentaje: pct, slaVencido: pct >= 90 };
}

function translateStatusToExternal(status: string): string[] {
  switch (status) {
    case "PENDIENTE": return ["pendiente", "sin_atender"];
    case "EN_PROCESO": return ["en_proceso"];
    case "CERRADO": return ["cerrado", "resuelto"];
    default: return [status.toLowerCase()];
  }
}

interface ViewRow {
  id: string;
  cliente: string;
  dominio: string;
  canal: string;
  pais: string;
  asesor: string | null;
  categoria: string | null;
  subcategoria: string | null;
  estado_homologado: string | null;
  fecha: Date | null;
  primera_respuesta_min_norm: number | null;
  resolucion_min_norm: number | null;
}

export class PgTicketRepository implements ITicketRepository {
  async findById(id: string): Promise<Ticket | null> {
    const rows = await prisma.$queryRaw<ViewRow[]>`
      SELECT
        ctid::text AS id,
        COALESCE(NULLIF(TRIM(cliente), ''), 'Sin nombre') AS cliente,
        COALESCE(NULLIF(TRIM(dominio), ''), '') AS dominio,
        COALESCE(canal, '') AS canal,
        COALESCE(NULLIF(TRIM(pais), ''), '') AS pais,
        asesor, categoria, subcategoria, estado_homologado, fecha,
        primera_respuesta_min_norm, resolucion_min_norm
      FROM public.v_unificado_norm
      WHERE ctid::text = ${id}
      LIMIT 1
    `;
    if (!rows.length) return null;
    return this.rowToTicket(rows[0]);
  }

  async findAll(filters?: TicketFilters): Promise<{ tickets: Ticket[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.status) {
      const estados = translateStatusToExternal(filters.status);
      const orClauses = estados.map(() => `estado_homologado ILIKE $${idx++}`).join(" OR ");
      conditions.push(`(${orClauses})`);
      params.push(...estados);
    }
    if (filters?.channel) {
      conditions.push(`canal ILIKE $${idx++}`);
      params.push(`%${filters.channel}%`);
    }
    if (filters?.asesorId) {
      conditions.push(`asesor ILIKE $${idx++}`);
      params.push(`%${filters.asesorId}%`);
    }
    if (filters?.search) {
      conditions.push(`(cliente ILIKE $${idx} OR dominio ILIKE $${idx} OR categoria ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    const countResult = await prisma.$queryRawUnsafe<{ total: number }[]>(
      `SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${where}`,
      ...params,
    );
    const total = countResult[0]?.total ?? 0;

    const rows = await prisma.$queryRawUnsafe<ViewRow[]>(
      `SELECT
        ctid::text AS id,
        COALESCE(NULLIF(TRIM(cliente), ''), 'Sin nombre') AS cliente,
        COALESCE(NULLIF(TRIM(dominio), ''), '') AS dominio,
        COALESCE(canal, '') AS canal,
        COALESCE(NULLIF(TRIM(pais), ''), '') AS pais,
        asesor, categoria, subcategoria, estado_homologado, fecha,
        primera_respuesta_min_norm, resolucion_min_norm
      FROM public.v_unificado_norm
      ${where}
      ORDER BY fecha DESC NULLS LAST
      OFFSET ${offset} LIMIT ${limit}`,
      ...params,
    );

    const tickets = rows.map((r) => this.rowToTicket(r));
    return { tickets, total };
  }

  async save(ticket: Ticket): Promise<Ticket> {
    throw new Error("PgTicketRepository is read-only for now");
  }

  async delete(id: string): Promise<boolean> {
    throw new Error("PgTicketRepository is read-only for now");
  }

  private rowToTicket(row: ViewRow): Ticket {
    const status = translateState(row.estado_homologado);
    const channel = translateChannel(row.canal);
    const { slaPorcentaje, slaVencido } = calculateSla(row.primera_respuesta_min_norm, row.resolucion_min_norm);
    const ahora = new Date().toISOString();

    const data: TicketData = {
      id: row.id,
      channel,
      status,
      priority: slaVencido ? "ALTA" : "MEDIA",
      priorityScore: slaVencido ? 60 : 30,
      clienteId: row.dominio || row.id,
      clienteNombre: row.cliente,
      clienteDominio: row.dominio,
      pais: row.pais,
      asesorId: row.asesor ?? undefined,
      asesorNombre: row.asesor ?? undefined,
      asunto: `${row.categoria ?? "Sin categoría"} - ${row.pais}`,
      categoriaFinal: row.categoria ?? undefined,
      subcategoriaFinal: row.subcategoria ?? undefined,
      slaPorcentaje,
      slaVencido,
      tags: [],
      noLeido: 1,
      ultimoMensaje: `${row.canal} - ${row.pais}`,
      ultimoMensajeEn: row.fecha?.toISOString() ?? ahora,
      createdAt: row.fecha?.toISOString() ?? ahora,
      updatedAt: ahora,
    };

    return new Ticket(data);
  }
}
