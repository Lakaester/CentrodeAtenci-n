/**
 * Contexto local para la creación automática QyD.
 *
 * Lee exclusivamente PostgreSQL:
 *   - public.atencion            (snapshot operativo + zendesk_snapshot)
 *   - public.v_unificado_norm    (respaldo histórico)
 *   - public.qd_relaciones_ticket (padre/follow-ups verificados)
 *
 * No llama a la API de Zendesk. Si falta un dato crítico, el llamador debe
 * devolver PENDIENTE_* y no crear un expediente incompleto.
 */
import { prisma } from "../repositories/prisma";
import { qdRepository } from "../repositories/quejasDevoluciones.repository";
import {
  atencionOperativaRepository,
  type DatosZendeskSnapshot,
} from "../repositories/atencionOperativa.repository";
import { normalizeDomain, isValidDomainFormat } from "../domain/contacto/normalizacion";
import { normalizarCanal, type CanalQyd } from "./quejasCasos.service";

export interface ContextoQydLocal {
  ticketId: string;
  /** Dominio canónico, o null si el valor original no es un dominio real. */
  dominio: string | null;
  /** Valor crudo del dominio, conservado para auditoría (puede ser correo/placeholder). */
  dominioOriginal: string | null;
  pais: string | null;
  canal: CanalQyd | null;
  canalRaw: string | null;
  asesor: string | null;
  estado: string | null;
  fechaOriginalIso: string | null;
  ticketPadreId: string | null;
  followupIds: string[];
  relacionVerificada: boolean;
  fuente: {
    atencion: boolean;
    vista: boolean;
    relacionCache: boolean;
  };
}

interface VistaQydRow {
  created_at: string | null;
  categoria: string | null;
  subcategoria: string | null;
  dominio: string | null;
  pais: string | null;
  canal: string | null;
  asesor: string | null;
  estado: string | null;
}

function normalizarCanalFuente(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const c = raw.trim().toLowerCase();
  if (c.includes("zendesk")) return "correo";
  if (c.includes("what") || c.includes("wpp")) return "whatsapp";
  if (c.includes("correo") || c.includes("email")) return "correo";
  if (c.includes("chat")) return "chat";
  return raw;
}

function dominioCanonico(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return isValidDomainFormat(raw) ? normalizeDomain(raw) : null;
}

async function leerVista(ticketId: string): Promise<VistaQydRow | null> {
  try {
    const rows = await prisma.$queryRawUnsafe<VistaQydRow[]>(
      `SELECT * FROM (
         SELECT DISTINCT ON (v.ticket_id::text)
           CASE
             WHEN v.tickets_created_at IS NOT NULL THEN
               to_char(v.tickets_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
             WHEN v.fecha IS NOT NULL THEN
               to_char(v.fecha::timestamp, 'YYYY-MM-DD"T"00:00:00"Z"')
             ELSE NULL
           END AS created_at,
           v.categoria AS categoria,
           v.subcategoria AS subcategoria,
           v.dominio AS dominio,
           v.pais AS pais,
           v.canal AS canal,
           v.asesor AS asesor,
           v.estado AS estado
         FROM public.v_unificado_norm v
         WHERE v.ticket_id::text = $1
         ORDER BY v.ticket_id::text, COALESCE(v.tickets_created_at, v.fecha::timestamp) ASC
       ) q
       LIMIT 1`,
      ticketId,
    );
    return rows[0] ?? null;
  } catch (err) {
    // La vista es respaldo. Si no está disponible, el snapshot operativo puede
    // seguir siendo suficiente; no se inventa información.
    console.warn(
      `[QyD] v_unificado_norm no disponible para contexto #${ticketId}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

export async function obtenerContextoQydLocal(ticketId: string): Promise<ContextoQydLocal | null> {
  const [atencion, vista, relacion] = await Promise.all([
    atencionOperativaRepository.obtenerPorTicket(ticketId),
    leerVista(ticketId),
    qdRepository.relacionCache(ticketId),
  ]);

  if (!atencion && !vista && !relacion) return null;

  const snap = (atencion?.zendesk_snapshot ?? null) as DatosZendeskSnapshot | null;
  const snapRelacionada = snap?.relacionVerificada === true || !!snap?.via?.source;
  const cacheRelacionada = relacion?.origen === "zendesk";
  const viaPadre = snap?.via?.source?.rel === "follow_up"
    && snap?.via?.source?.from?.ticket_id != null
    ? String(snap.via.source.from.ticket_id)
    : null;

  // El snapshot de la página es la fuente más reciente para la relación; la
  // caché se usa si el snapshot no la trae.
  const ticketPadreId = snapRelacionada
    ? (snap?.ticketPadreId ?? viaPadre)
    : (relacion?.ticket_padre_id ?? null);
  const followupIds = snap?.followupIds?.length
    ? snap.followupIds
    : (relacion?.followup_ids ?? []);

  const canalRaw = snap?.canalRaw
    ?? snap?.via?.channel
    ?? snap?.canal
    ?? vista?.canal
    ?? null;

  const dominioRaw = atencion?.dominio_identificado
    ?? snap?.dominio
    ?? vista?.dominio
    ?? null;

  return {
    ticketId,
    dominio: dominioCanonico(dominioRaw),
    dominioOriginal: dominioRaw,
    pais: snap?.pais ?? vista?.pais ?? null,
    canal: normalizarCanal(normalizarCanalFuente(canalRaw)),
    canalRaw,
    asesor: atencion?.asesor ?? vista?.asesor ?? null,
    estado: atencion?.estado ?? snap?.estado ?? vista?.estado ?? null,
    fechaOriginalIso: snap?.createdAt ?? vista?.created_at ?? null,
    ticketPadreId,
    followupIds,
    relacionVerificada: snapRelacionada || cacheRelacionada,
    fuente: {
      atencion: !!atencion,
      vista: !!vista,
      relacionCache: cacheRelacionada,
    },
  };
}
